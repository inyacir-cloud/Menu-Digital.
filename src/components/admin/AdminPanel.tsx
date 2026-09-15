import { useEffect, useState, type ReactNode } from "react";
import type { MenuStore } from "../../hooks/useMenuStore";
import type { AdminAuth } from "../../hooks/useAdminAuth";
import { DEFAULT_THEME } from "../../data/menu";
import { themeStyle } from "../../utils/color";
import { cn } from "../../utils/cn";
import {
  ChatIcon,
  CloseIcon,
  GlassIceIcon,
  GearIcon,
  LeafIcon,
  ListIcon,
  LockIcon,
  LogoutIcon,
  PaletteIcon,
  TicketIcon,
} from "../icons";
import { MenuEditor } from "./MenuEditor";
import { SeasonalEditor } from "./SeasonalEditor";
import { BebidasEditor } from "./BebidasEditor";
import { CombosEditor } from "./CombosEditor";
import { CouponEditor } from "./CouponEditor";
import { BusinessEditor } from "./BusinessEditor";
import { MessageEditor } from "./MessageEditor";
import { ThemeEditor } from "./ThemeEditor";
import { SecurityEditor } from "./SecurityEditor";

type Tab = "inicio" | "menu" | "temporada" | "bebidas" | "combos" | "cupones" | "negocio" | "mensaje" | "colores" | "seguridad";

interface TabDef {
  id: Tab;
  label: string;
  sub: string;
  icon: ReactNode;
}

const GROUPS: { title: string; tabs: TabDef[] }[] = [
  {
    title: "Panel",
    tabs: [{ id: "inicio", label: "Inicio", sub: "Resumen y accesos rápidos", icon: <GearIcon className="h-4 w-4" /> }],
  },
  {
    title: "Datos del menú",
    tabs: [
      { id: "menu", label: "Productos", sub: "Categorías y platillos", icon: <ListIcon className="h-4 w-4" /> },
      { id: "temporada", label: "Temporada", sub: "Productos de temporada", icon: <LeafIcon className="h-4 w-4" /> },
      { id: "bebidas", label: "Bebidas del día", sub: "Aguas de sabor y refrescos", icon: <GlassIceIcon className="h-4 w-4" /> },
      { id: "combos", label: "Combos", sub: "Ofertas y elecciones", icon: <TicketIcon className="h-4 w-4" /> },
      { id: "cupones", label: "Cupones", sub: "Códigos de descuento", icon: <TicketIcon className="h-4 w-4" /> },
    ],
  },
  {
    title: "Configuraciones",
    tabs: [
      { id: "negocio", label: "Local y pagos", sub: "Logo, horario, dirección, pagos", icon: <GearIcon className="h-4 w-4" /> },
      { id: "mensaje", label: "Mensaje WhatsApp", sub: "Plantilla del pedido", icon: <ChatIcon className="h-4 w-4" /> },
      { id: "colores", label: "Colores", sub: "Paleta y tema del menú", icon: <PaletteIcon className="h-4 w-4" /> },
      { id: "seguridad", label: "Seguridad", sub: "Contraseña y respaldos", icon: <LockIcon className="h-4 w-4" /> },
    ],
  },
];

interface Props {
  store: MenuStore;
  auth: AdminAuth;
  onClose: () => void;
  onLogout: () => void;
  onReLogin: () => void;
  notify: (text: string) => void;
}

export function AdminPanel({ store, auth, onClose, onLogout, onReLogin, notify }: Props) {
  const [tab, setTab] = useState<Tab>("inicio");
  const [sideOpen, setSideOpen] = useState(false);

  // Bloquear scroll del fondo + cerrar con Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selectTab = (id: Tab) => {
    setTab(id);
    setSideOpen(false);
  };

  const activeLabel = GROUPS.flatMap((g) => g.tabs).find((t) => t.id === tab)?.label ?? "";

  return (
    <div
      style={themeStyle(DEFAULT_THEME)}
      className="fixed inset-0 z-50 flex animate-fade flex-col bg-[#f3f4f6] text-ink"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
    >
      {/* ────────────────────── HEADER ────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 bg-[#111827] px-4 py-3 text-white sm:px-5">
        {/* Hamburger (móvil) */}
        <button
          type="button"
          onClick={() => setSideOpen((v) => !v)}
          aria-label="Menú de secciones"
          className="grid h-9 w-9 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h2 id="admin-title" className="text-sm font-extrabold leading-tight sm:text-base">
            Panel de Administración
          </h2>
          <p className="truncate text-[0.68rem] text-white/50">{store.settings.name}</p>
        </div>

        {/* Estado abierto / cerrado */}
        <button
          type="button"
          onClick={() => {
            const next = !store.settings.open;
            store.updateSettings({ open: next });
            notify(next ? "Negocio abierto · pedidos habilitados" : "Negocio cerrado · menú solo consulta");
          }}
          className={cn(
            "hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 sm:inline-flex",
            store.settings.open
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-red-500/20 text-red-300 hover:bg-red-500/30",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", store.settings.open ? "bg-emerald-400" : "animate-pulse bg-red-400")} />
          {store.settings.open ? "Abierto" : "Cerrado"}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          <LogoutIcon className="h-3.5 w-3.5" />
          Salir
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="grid h-9 w-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Avisos globales */}
      {store.storageError && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-red-600 px-4 py-2 text-center text-xs font-medium text-white">
          <span>{store.storageError}</span>
          <button
            type="button"
            onClick={onReLogin}
            className="font-bold underline underline-offset-2 hover:text-red-100"
          >
            Volver a iniciar sesión
          </button>
        </div>
      )}
      {auth.isDefaultPassword && tab !== "seguridad" && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800 ring-1 ring-amber-200">
          <span>⚠️ Aún usas la contraseña inicial.</span>
          <button type="button" onClick={() => selectTab("seguridad")} className="font-bold underline underline-offset-2">
            Cámbiala aquí
          </button>
        </div>
      )}

      {/* Estado abierto / cerrado — versión móvil */}
      <div className="flex items-center gap-3 border-b border-ink/10 bg-white px-4 py-2 sm:hidden">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", store.settings.open ? "bg-emerald-500" : "animate-pulse bg-red-500")} />
        <p className="flex-1 text-xs text-ink/70">
          <span className="font-bold text-ink">{store.settings.open ? "Abierto" : "Cerrado"}</span>
          {" · "}
          {store.settings.open ? "pedidos habilitados" : "solo consulta"}
        </p>
        <button
          type="button"
          onClick={() => {
            const next = !store.settings.open;
            store.updateSettings({ open: next });
            notify(next ? "Negocio abierto" : "Negocio cerrado");
          }}
          className={cn(
            "rounded-full px-3 py-1 text-[0.68rem] font-bold transition active:scale-95",
            store.settings.open ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
          )}
        >
          {store.settings.open ? "Cerrar" : "Abrir"}
        </button>
      </div>

      {/* ────────────────────── BODY (Sidebar + Content) ────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — escritorio fija, móvil overlay */}
        {sideOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/40 lg:hidden"
            onClick={() => setSideOpen(false)}
            aria-hidden="true"
          />
        )}
        <nav
          className={cn(
            "z-20 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain bg-white p-3 shadow-lg transition-transform duration-200 lg:relative lg:translate-x-0 lg:shadow-none lg:ring-1 lg:ring-ink/8",
            sideOpen ? "fixed inset-y-0 left-0 top-[52px] translate-x-0" : "fixed -translate-x-full lg:relative",
          )}
          role="tablist"
          aria-label="Secciones del panel"
        >
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-1">
              <p className="px-2 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink/40">
                {group.title}
              </p>
              {group.tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => selectTab(t.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition",
                    tab === t.id
                      ? "bg-[#111827] text-white shadow-sm"
                      : "text-ink/70 hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", tab === t.id ? "text-amber-400" : "text-ink/45")}>
                    {t.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{t.label}</span>
                    <span className={cn("block text-[0.65rem] leading-snug", tab === t.id ? "text-white/55" : "text-ink/45")}>
                      {t.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {/* Acciones rápidas en sidebar (móvil) */}
          <div className="mt-auto border-t border-ink/8 pt-3 lg:hidden">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogoutIcon className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {/* Breadcrumb */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-ink/8 bg-white/90 px-5 py-2.5 backdrop-blur-md lg:px-8">
            <button
              type="button"
              onClick={() => setSideOpen(true)}
              className="text-[0.68rem] font-bold text-ink/45 transition hover:text-ink lg:pointer-events-none"
            >
              Panel
            </button>
            <span className="text-ink/30">/</span>
            <span className="text-sm font-bold text-ink">{activeLabel}</span>
          </div>

          <div className="px-5 py-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              {tab === "inicio" && <AdminHome onSelect={selectTab} />}
              {tab === "menu" && <MenuEditor store={store} notify={notify} />}
              {tab === "temporada" && <SeasonalEditor store={store} notify={notify} />}
              {tab === "bebidas" && <BebidasEditor store={store} notify={notify} />}
              {tab === "combos" && <CombosEditor store={store} notify={notify} />}
              {tab === "cupones" && <CouponEditor store={store} notify={notify} />}
              {tab === "negocio" && <BusinessEditor key="negocio" store={store} notify={notify} />}
              {tab === "mensaje" && <MessageEditor key="mensaje" store={store} notify={notify} />}
              {tab === "colores" && (
                <ThemeEditor key="colores" store={store} notify={notify} onPreviewInMenu={onClose} />
              )}
              {tab === "seguridad" && <SecurityEditor store={store} auth={auth} notify={notify} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminHome({ onSelect }: { onSelect: (tab: Tab) => void }) {
  const shortcuts = GROUPS.find((group) => group.title === "Datos del menú")?.tabs ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-paper-light p-5 text-center shadow-sm ring-1 ring-ink/8 sm:p-8">
        <img src="/logo2.png" alt="El Gordo & La Flaca" className="mx-auto h-auto max-h-32 w-auto max-w-[18rem] object-contain" />
        <p className="mt-4 text-sm font-semibold text-ink/60">Panel de administración</p>
      </div>

      <section>
        <h3 className="text-lg font-bold text-ink">Datos del menú</h3>
        <p className="mt-1 text-sm text-ink/60">Elige una opción para administrar el contenido del menú.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              onClick={() => onSelect(shortcut.id)}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-ink/8 transition hover:-translate-y-0.5 hover:ring-ink/20"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink/70">
                {shortcut.icon}
              </span>
              <span>
                <span className="block font-bold text-ink">{shortcut.label}</span>
                <span className="mt-0.5 block text-xs text-ink/55">{shortcut.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
