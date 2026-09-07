import { useRef, useState, type ChangeEvent } from "react";
import { BUILTIN_IMAGES, resolveImage } from "../../data/menu";
import { dataUrlSizeKb, fileToResizedDataUrl } from "../../utils/image";
import { cn } from "../../utils/cn";
import { ImageIcon, TrashIcon, UploadIcon } from "../icons";
import { Button } from "./ui";

interface Props {
  label: string;
  value?: string;
  onChange: (next: string | undefined) => void;
  /** Lado máximo en píxeles al comprimir */
  maxSize?: number;
  /** Permite elegir las fotos incluidas en la app */
  allowBuiltin?: boolean;
  hint?: string;
}

export function ImageField({ label, value, onChange, maxSize = 640, allowBuiltin = false, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = resolveImage(value);

  const sizeInfo = value?.startsWith("data:")
    ? `≈ ${dataUrlSizeKb(value)} KB`
    : value?.startsWith("builtin:")
      ? "Foto incluida en la app"
      : null;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await fileToResizedDataUrl(file, maxSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la imagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="text-xs font-semibold text-ink/70">{label}</span>
      <div className="mt-1 flex items-start gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-ink/10">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-7 w-7 text-ink/30" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              icon={<UploadIcon className="h-4 w-4" />}
            >
              {busy ? "Procesando…" : src ? "Cambiar foto" : "Subir foto"}
            </Button>
            {src && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
                icon={<TrashIcon className="h-4 w-4" />}
              >
                Quitar
              </Button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {allowBuiltin && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.7rem] text-ink/50">Incluidas:</span>
              {Object.entries(BUILTIN_IMAGES).map(([key, url]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(`builtin:${key}`)}
                  aria-label={`Usar foto de ${key}`}
                  className={cn(
                    "h-9 w-9 overflow-hidden rounded-lg ring-2 transition",
                    value === `builtin:${key}` ? "ring-ink" : "ring-transparent hover:ring-ink/30",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {error ? (
            <p className="text-xs font-medium text-red-600">{error}</p>
          ) : (
            <p className="text-[0.7rem] leading-snug text-ink/50">
              {[sizeInfo, hint].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
