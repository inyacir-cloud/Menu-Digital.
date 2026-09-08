import { useEffect, useRef, useState, type FormEvent } from "react";
import { DEFAULT_PASSWORD, DEFAULT_THEME } from "../../data/menu";
import { themeStyle } from "../../utils/color";
import { cn } from "../../utils/cn";
import { CloseIcon, EyeIcon, EyeOffIcon, LockIcon } from "../icons";
import { Button, inputCls } from "./ui";

interface Props {
  onClose: () => void;
  onLogin: (email: string, password: string) => boolean | Promise<boolean>;
  isDefaultPassword: boolean;
}

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

export function AdminLogin({ onClose, onLogin, isDefaultPassword }: Props) {
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Demasiados intentos. Espera ${Math.ceil((lockedUntil - Date.now()) / 1000)} s.`);
      return;
    }
    if (await onLogin(email, password)) return;

    const n = attempts + 1;
    setPassword("");
    setShake((s) => s + 1);
    if (n >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_MS);
      setAttempts(0);
      setError("Demasiados intentos. Espera 30 segundos.");
    } else {
      setAttempts(n);
      setError(`Contraseña incorrecta (${MAX_ATTEMPTS - n} intentos restantes)`);
    }
    inputRef.current?.focus();
  };

  return (
    <div
      style={themeStyle(DEFAULT_THEME)}
      className="fixed inset-0 z-50 grid place-items-center p-4 text-ink"
    >
      <div
        className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-sm animate-pop overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Cabecera oscura */}
        <div className="bg-[#111827] px-6 pb-5 pt-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-[#111827] shadow-md">
            <LockIcon className="h-6 w-6" />
          </span>
          <h2 id="login-title" className="mt-3 text-xl font-extrabold tracking-tight">
            Panel de Administración
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Ingresa la contraseña para administrar tu menú digital.
          </p>
        </div>

        {/* Cuerpo */}
        <div key={shake} className={cn("px-6 py-5", shake > 0 && "animate-shake")}>
          <label className="mb-3 block">
            <span className="text-xs font-semibold text-ink/70">Correo del administrador</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className={cn(inputCls, "mt-1", error && "border-red-400")}
              placeholder="admin@tudominio.com"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/70">Contraseña</span>
            <div className="relative mt-1">
              <input
                ref={inputRef}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={cn(inputCls, "pr-11", error && "border-red-400")}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-ink/10 hover:text-ink"
              >
                {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
          </label>

          {isDefaultPassword && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              Contraseña inicial: <code className="rounded bg-amber-100 px-1 py-0.5 font-bold">{DEFAULT_PASSWORD}</code>
              . Cámbiala en "Seguridad" en cuanto entres.
            </p>
          )}

          <Button type="submit" className="mt-4 w-full" disabled={!password}>
            Entrar al panel
          </Button>
        </div>
      </form>
    </div>
  );
}
