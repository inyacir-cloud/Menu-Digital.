import { useEffect, useState } from "react";
import type { Theme } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { DEFAULT_THEME } from "../../data/menu";
import { THEME_PRESETS } from "../../data/themes";
import { contrastRatio, isHexDraft, normalizeHex } from "../../utils/color";
import { cn } from "../../utils/cn";
import { ThemePreview } from "./ThemePreview";
import { Button, Card, SaveBar, SectionTitle, TextInput } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
  /** Cierra el panel para ver el resultado en el menú */
  onPreviewInMenu: () => void;
}

const sameTheme = (a: Theme, b: Theme) =>
  a.background === b.background && a.text === b.text && a.primary === b.primary && a.secondary === b.secondary;

export function ThemeEditor({ store, notify, onPreviewInMenu }: Props) {
  const [draft, setDraft] = useState<Theme>(store.settings.theme);
  const dirty = !sameTheme(draft, store.settings.theme);
  const set = (patch: Partial<Theme>) =>
    setDraft((d) => {
      const next = { ...d, ...patch };
      store.updateSettings({ theme: next });
      return next;
    });

  const textContrast = contrastRatio(draft.text, draft.background);
  const warnings: string[] = [];
  if (textContrast < 4.5) warnings.push("Poco contraste entre el texto y el fondo: el menú será difícil de leer.");
  if (contrastRatio(draft.primary, draft.background) < 1.4)
    warnings.push("El color principal casi no se distingue del fondo.");
  if (contrastRatio(draft.primary, draft.text) < 1.4)
    warnings.push("El color principal es casi igual al del texto: algunos botones no se distinguirán.");

  const activePreset = THEME_PRESETS.find((p) => sameTheme(p.theme, draft))?.id;

  const save = () => {
    store.updateSettings({ theme: draft });
    notify("Colores guardados");
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <SectionTitle>Colores del menú</SectionTitle>
        <p className="mt-0.5 text-sm text-ink/60">
          Elige una combinación o ajusta cada color. Los tonos derivados (sombras, fondos de tarjetas, texto
          sobre botones) se calculan solos.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <h4 className="font-bold">Combinaciones</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDraft(p.theme)}
                  aria-pressed={activePreset === p.id}
                  className={cn(
                    "rounded-xl border p-2 text-left transition",
                    activePreset === p.id ? "border-ink ring-2 ring-ink/20" : "border-ink/10 hover:border-ink/40",
                  )}
                >
                  <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-black/10">
                    <span className="flex-1" style={{ background: p.theme.background }} />
                    <span className="flex-1" style={{ background: p.theme.primary }} />
                    <span className="flex-1" style={{ background: p.theme.secondary }} />
                    <span className="w-3" style={{ background: p.theme.text }} />
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold">{p.name}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h4 className="font-bold">Personalizar</h4>
            <ColorField
              label="Fondo"
              description="Color del papel del menú"
              value={draft.background}
              onChange={(v) => set({ background: v })}
            />
            <ColorField
              label="Texto"
              description="Títulos, nombres y precios"
              value={draft.text}
              onChange={(v) => set({ text: v })}
            />
            <ColorField
              label="Principal"
              description="Botones +, etiquetas y manchas decorativas"
              value={draft.primary}
              onChange={(v) => set({ primary: v })}
            />
            <ColorField
              label="Secundario"
              description="Borde de las manchas y contador del carrito"
              value={draft.secondary}
              onChange={(v) => set({ secondary: v })}
            />
          </Card>

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
              onClick={() => setDraft(DEFAULT_THEME)}
              disabled={sameTheme(draft, DEFAULT_THEME)}
            >
              Restaurar colores originales
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink/50">Vista previa</p>
          <ThemePreview theme={draft} name={store.settings.name} />
          <p className="mt-2 text-[0.7rem] text-ink/50">
            Contraste texto / fondo: <span className="font-semibold">{textContrast.toFixed(1)}:1</span>
            {textContrast >= 4.5 ? " ✓ legible" : " · se recomienda 4.5 o más"}
          </p>
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} saveLabel="Guardar colores">
        <Button
          variant="ghost"
          onClick={() => {
            if (dirty) {
              store.updateSettings({ theme: draft });
              notify("Colores guardados");
            }
            onPreviewInMenu();
          }}
        >
          Ver en el menú
        </Button>
      </SaveBar>
    </div>
  );
}

/* ---------- Selector de color ---------- */

interface ColorFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorField({ label, description, value, onChange }: ColorFieldProps) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = text.trim() !== "" && !isHexDraft(text);

  return (
    <div className="flex items-center gap-3">
      <label
        className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-ink/15"
        style={{ background: value }}
        title="Elegir color"
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label}: elegir color`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink/55">{description}</p>
      </div>
      <TextInput
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (next.trim() === "") return;
          const hex = normalizeHex(next);
          if (hex) onChange(hex);
        }}
        onBlur={() => {
          const trimmed = text.trim();
          if (!trimmed) {
            setText(value);
            return;
          }
          const hex = normalizeHex(trimmed);
          setText(hex ?? value);
        }}
        maxLength={7}
        spellCheck={false}
        aria-label={`${label}: código hexadecimal`}
        invalid={invalid}
        className="w-28 font-mono uppercase"
      />
    </div>
  );
}
