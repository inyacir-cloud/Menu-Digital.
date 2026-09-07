import type { ButtonHTMLAttributes, ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../../utils/cn";

export const inputCls =
  "w-full rounded-xl border border-ink/15 bg-paper/40 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:bg-white focus:ring-2 focus:ring-mustard/40";

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-xl font-extrabold tracking-tight", className)}>{children}</h3>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/8", className)}>{children}</div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
  /** Usa <div> en lugar de <label> (para controles compuestos) */
  plain?: boolean;
}

export function Field({ label, hint, error, children, className, plain }: FieldProps) {
  const Tag = plain ? "div" : "label";
  return (
    <Tag className={cn("block", className)}>
      <span className="text-xs font-semibold text-ink/70">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[0.7rem] leading-snug text-ink/50">{hint}</span>
      ) : null}
    </Tag>
  );
}

export function TextInput({
  className,
  invalid,
  ...rest
}: ComponentPropsWithRef<"input"> & { invalid?: boolean }) {
  return <input className={cn(inputCls, invalid && "border-red-400", className)} {...rest} />;
}

export function TextArea({ className, ...rest }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={cn(inputCls, "resize-none", className)} {...rest} />;
}

type Variant = "primary" | "ghost" | "danger" | "wa";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper shadow-sm hover:bg-black",
  ghost: "border border-ink/15 bg-white text-ink hover:border-ink/40 hover:bg-paper/60",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  wa: "bg-wa text-white shadow-sm hover:bg-wa-deep",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  danger?: boolean;
}

export function IconBtn({ label, danger, className, children, type = "button", ...rest }: IconBtnProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/60 transition disabled:opacity-25 disabled:hover:bg-transparent [&>svg]:h-4 [&>svg]:w-4",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-ink/10 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Nombre accesible del interruptor */
  label: string;
  className?: string;
}

/** Interruptor compacto (solo la pastilla) para filas de listas */
export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-wa" : "bg-ink/20",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-wa" : "bg-ink/20",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-ink/55">{description}</span>}
      </span>
    </button>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div
      className="grid gap-1 rounded-xl bg-ink/5 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-lg px-2 py-1.5 text-xs font-semibold transition",
            value === o.value ? "bg-ink text-paper shadow" : "text-ink/70 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Thumb({
  src,
  size = "md",
  className,
}: {
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm" ? "h-9 w-9 rounded-lg" : size === "lg" ? "h-14 w-14 rounded-xl" : "h-11 w-11 rounded-xl";
  return (
    <div
      className={cn("grid shrink-0 place-items-center overflow-hidden bg-paper ring-1 ring-ink/10", dim, className)}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden="true" />
      )}
    </div>
  );
}

interface SaveBarProps {
  dirty: boolean;
  error?: string | null;
  onSave: () => void;
  saveLabel?: string;
  /** Acciones adicionales a la izquierda del botón de guardar */
  children?: ReactNode;
}

/** Barra fija inferior con estado de cambios y botón de guardar */
export function SaveBar({ dirty, error, onSave, saveLabel = "Guardar cambios", children }: SaveBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <p className="text-xs text-ink/60">
          {error ? (
            <span className="font-medium text-red-600">{error}</span>
          ) : dirty ? (
            "Tienes cambios sin guardar"
          ) : (
            "Todo guardado"
          )}
        </p>
        <div className="flex items-center gap-2">
          {children}
          <Button onClick={onSave} disabled={!dirty}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
