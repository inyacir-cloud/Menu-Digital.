import { useMemo, useRef, useState } from "react";
import type { MenuStore } from "../../hooks/useMenuStore";
import { DEFAULT_CONTACT_MESSAGE, DEFAULT_MESSAGE_TEMPLATE } from "../../data/menu";
import { PLACEHOLDERS, renderTemplate, unknownPlaceholders } from "../../utils/template";
import { SAMPLE_CUSTOMER, SAMPLE_LINES, buildOrderVars, buildWhatsAppUrl } from "../../utils/whatsapp";
import { WhatsAppIcon } from "../icons";
import { Button, Card, Field, SaveBar, SectionTitle, TextArea, TextInput } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

export function MessageEditor({ store, notify }: Props) {
  const [template, setTemplate] = useState(store.settings.messageTemplate);
  const [contact, setContact] = useState(store.settings.contactMessage);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = template !== store.settings.messageTemplate || contact !== store.settings.contactMessage;

  const preview = useMemo(
    () => renderTemplate(template, buildOrderVars(SAMPLE_LINES, SAMPLE_CUSTOMER, store.settings)),
    [template, store.settings],
  );

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!template.includes("{total}")) list.push("No incluye {total}: no verás el total del pedido.");
    if (!template.includes("{nombre}")) list.push("No incluye {nombre}: no sabrás quién hace el pedido.");
    const unknown = unknownPlaceholders(template);
    if (unknown.length > 0) list.push(`Marcadores desconocidos (se enviarán tal cual): ${unknown.join(", ")}`);
    return list;
  }, [template]);

  /** Inserta un marcador donde esté el cursor */
  const insert = (key: string) => {
    const token = `{${key}}`;
    const el = textareaRef.current;
    if (!el) {
      setTemplate((t) => t + token);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? start;
    setTemplate(template.slice(0, start) + token + template.slice(end));
    setError(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const save = () => {
    if (!template.trim()) {
      setError("El mensaje no puede estar vacío");
      return;
    }
    if (!template.includes("{pedido}")) {
      setError("El mensaje debe incluir {pedido} para que llegue la lista de productos");
      return;
    }
    setError(null);
    store.updateSettings({
      messageTemplate: template,
      contactMessage: contact.trim() || DEFAULT_CONTACT_MESSAGE,
    });
    notify("Mensaje de WhatsApp guardado");
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <SectionTitle>Mensaje de WhatsApp</SectionTitle>
        <p className="mt-0.5 text-sm text-ink/60">
          Así llegará cada pedido a tu WhatsApp. Escribe el texto que quieras y usa los marcadores para
          insertar los datos del pedido.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-ink/70">Insertar dato</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => insert(p.key)}
                    title={p.description}
                    className="rounded-full border border-ink/15 bg-paper/60 px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-ink transition hover:border-ink hover:bg-white"
                  >
                    {`{${p.key}}`}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Plantilla del mensaje"
              hint="Usa *asteriscos* para negritas. Las líneas cuyo dato quede vacío (p. ej. la dirección cuando pasan a recoger) se omiten solas."
            >
              <TextArea
                ref={textareaRef}
                rows={15}
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  setError(null);
                }}
                spellCheck={false}
                className="font-mono text-[0.8rem] leading-relaxed"
              />
            </Field>

            {warnings.length > 0 && (
              <div className="space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                {warnings.map((w) => (
                  <p key={w}>⚠️ {w}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTemplate(DEFAULT_MESSAGE_TEMPLATE);
                  setError(null);
                }}
                disabled={template === DEFAULT_MESSAGE_TEMPLATE}
              >
                Restaurar mensaje original
              </Button>
            </div>
          </Card>

          <Card>
            <Field
              label="Mensaje del botón “¿Dudas? Escríbenos por WhatsApp”"
              hint="Texto con el que el cliente inicia la conversación desde el pie del menú."
            >
              <TextInput value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
          </Card>

          <Card>
            <h4 className="font-bold">Marcadores disponibles</h4>
            <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
              {PLACEHOLDERS.map((p) => (
                <div key={p.key} className="flex gap-2">
                  <dt className="shrink-0 font-mono font-semibold text-ink">{`{${p.key}}`}</dt>
                  <dd className="text-ink/60">{p.description}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink/50">Vista previa</p>
          <MessagePreview text={preview} />
          <p className="mt-2 text-[0.7rem] text-ink/50">
            Ejemplo con un pedido de muestra (envío a domicilio, pago en efectivo).
          </p>
        </div>
      </div>

      <SaveBar dirty={dirty} error={error} onSave={save} saveLabel="Guardar mensaje">
        <a
          href={buildWhatsAppUrl(preview, store.settings.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-paper/60"
        >
          <WhatsAppIcon className="h-4 w-4 text-wa" />
          Probar
        </a>
      </SaveBar>
    </div>
  );
}

/* ---------- Vista previa estilo burbuja de WhatsApp ---------- */

function WhatsAppText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
          <strong key={i}>{p.slice(1, -1)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function MessagePreview({ text }: { text: string }) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="rounded-2xl bg-[#e5ddd5] p-3 shadow-inner">
      <div className="ml-auto max-w-[96%] whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-[0.78rem] leading-relaxed text-[#111b21] shadow-sm">
        <WhatsAppText text={text} />
        <div className="mt-1 flex items-center justify-end gap-1 text-[0.6rem] text-[#667781]">
          <span>{time}</span>
          <span className="text-[#53bdeb]">✓✓</span>
        </div>
      </div>
    </div>
  );
}
