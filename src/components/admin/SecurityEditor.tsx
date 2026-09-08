import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { MenuStore } from "../../hooks/useMenuStore";
import type { AdminAuth } from "../../hooks/useAdminAuth";
import { DownloadIcon, UploadIcon } from "../icons";
import { Button, Card, Field, SectionTitle, TextInput } from "./ui";

interface Props {
  store: MenuStore;
  auth: AdminAuth;
  notify: (text: string) => void;
}

export function SecurityEditor({ store, auth, notify }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== repeat) {
      setPwError("Las contraseñas nuevas no coinciden");
      return;
    }
    const err = await auth.changePassword(current, next);
    if (err) {
      setPwError(err);
      return;
    }
    setPwError(null);
    setCurrent("");
    setNext("");
    setRepeat("");
    notify("Contraseña actualizada");
  };

  const exportMenu = () => {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menu-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify("Menú exportado");
  };

  const importMenu = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Importar reemplazará el menú actual por el del archivo. ¿Continuar?")) return;
    const err = store.importJson(await file.text());
    setImportError(err);
    if (!err) notify("Menú importado correctamente");
  };

  const resetMenu = () => {
    if (
      window.confirm(
        "¿Restaurar el menú original? Se perderán categorías, productos, fotos y datos del negocio que hayas cambiado.",
      )
    ) {
      store.reset();
      notify("Menú restaurado");
    }
  };

  return (
    <div className="space-y-5">
      <SectionTitle>Seguridad y datos</SectionTitle>

      <Card>
        <h4 className="font-bold">Cambiar contraseña</h4>
        {auth.isDefaultPassword && (
          <p className="mt-2 rounded-lg bg-mustard/25 px-3 py-2 text-xs text-ink/80">
            ⚠️ Estás usando la contraseña inicial. Cámbiala para que nadie más pueda editar tu menú.
          </p>
        )}
        <form onSubmit={changePassword} className="mt-3 space-y-3">
          <Field label="Contraseña actual">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nueva contraseña" hint="Mínimo 6 caracteres">
              <TextInput
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>
            <Field label="Repetir nueva contraseña" error={pwError}>
              <TextInput
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                invalid={!!pwError}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!current || !next || !repeat}>
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h4 className="font-bold">Respaldo del menú</h4>
        <p className="mt-1 text-sm leading-relaxed text-ink/65">
          Los cambios se guardan <strong>en este navegador y dispositivo</strong>. Para pasarlos a otro
          teléfono o computadora, exporta el archivo e impórtalo allá. También sirve como copia de
          seguridad.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={exportMenu} icon={<DownloadIcon className="h-4 w-4" />}>
            Exportar menú (.json)
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()} icon={<UploadIcon className="h-4 w-4" />}>
            Importar menú
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importMenu} />
        </div>
        {importError && <p className="mt-2 text-xs font-medium text-red-600">{importError}</p>}
      </Card>

      <Card className="ring-red-200">
        <h4 className="font-bold text-red-700">Zona de riesgo</h4>
        <p className="mt-1 text-sm text-ink/65">
          Vuelve al menú original con sus seis categorías, precios y fotos.
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={resetMenu}>
            Restaurar menú original
          </Button>
        </div>
      </Card>
    </div>
  );
}
