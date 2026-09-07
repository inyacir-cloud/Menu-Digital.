import { cn } from "../../utils/cn";
import { GearIcon, LogoutIcon } from "../icons";

interface Props {
  open: boolean;
  onEdit: () => void;
  onLogout: () => void;
}

/** Barra superior visible solo cuando el administrador inició sesión */
export function AdminBar({ open, onEdit, onLogout }: Props) {
  return (
    <div className="sticky top-0 z-40 flex h-11 items-center gap-2 bg-[#111827] px-4 text-white shadow-md">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", open ? "bg-emerald-400" : "animate-pulse bg-red-400")} />
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-xs">
        Admin · {open ? "Abierto" : "Cerrado"}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-[#111827] shadow-sm transition hover:bg-amber-400 active:scale-95"
        >
          <GearIcon className="h-3.5 w-3.5" />
          Panel
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="grid h-7 w-7 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
