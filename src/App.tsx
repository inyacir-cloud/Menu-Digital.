import { useCallback, useEffect, useMemo, useState } from "react";
import type { Combo, ComboSelection, CustomerInfo, MenuCategory, MenuItem } from "./types";
import { useCart } from "./hooks/useCart";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useMenuStore } from "./hooks/useMenuStore";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { availableExtras, isAvailable } from "./utils/menu";
import { couponDiscount, couponError } from "./utils/coupon";
import { applyTheme } from "./utils/color";
import { Blob } from "./components/Blob";
import { Header } from "./components/Header";
import { CategoryNav } from "./components/CategoryNav";
import { MenuSection } from "./components/MenuSection";
import { SeasonalBand } from "./components/SeasonalBand";
import { BebidasBand } from "./components/BebidasBand";
import { ComboBand } from "./components/ComboBand";
import { ComboSheet } from "./components/ComboSheet";
import { SplashScreen } from "./components/SplashScreen";
import { Footer } from "./components/Footer";
import { CartButton } from "./components/CartButton";
import { CartDrawer } from "./components/CartDrawer";
import { ItemSheet, type SheetSelection } from "./components/ItemSheet";
import { Toast, type ToastData } from "./components/Toast";
import { LockIcon } from "./components/icons";
import { CloseIcon } from "./components/icons";
import { AdminBar } from "./components/admin/AdminBar";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";
import { makeCouponNotification, NotificationCenter, type MenuNotification } from "./components/NotificationCenter";
import waterImage from "../a.webp";
import notificationSound from "../noti.mp3";

const EMPTY_CUSTOMER: CustomerInfo = {
  name: "",
  mode: "envio",
  address: "",
  notes: "",
  payment: "",
  cashAmount: "",
};

interface SheetState {
  item: MenuItem;
  category: MenuCategory;
}

export default function App() {
  const store = useMenuStore();
  const auth = useAdminAuth();
  const cart = useCart();

  const [storedCustomer, setCustomer] = useLocalStorage<Partial<CustomerInfo>>(
    "egf-menu-customer-v1",
    EMPTY_CUSTOMER,
  );
  const customer = useMemo<CustomerInfo>(
    () => ({ ...EMPTY_CUSTOMER, ...storedCustomer }),
    [storedCustomer],
  );

  /** Sección de temporada como categoría sintética (solo si está activa y con productos) */
  const seasonalCategory = useMemo<MenuCategory | null>(() => {
    const s = store.seasonal;
    if (!s.enabled || s.items.length === 0) return null;
    return {
      id: "temporada",
      title: s.title.trim() || "De temporada",
      description: s.note.trim() || undefined,
      items: s.items,
      imageSide: "right",
    };
  }, [store.seasonal]);

  /** Sección de bebidas como categoría sintética (solo si está activa y con sabores habilitados) */
  const bebidasCategory = useMemo<MenuCategory | null>(() => {
    const b = store.bebidas;
    if (!b.enabled) return null;
    const available = b.items.filter((i) => !i.unavailable);
    if (available.length === 0) return null;
    return {
      id: "bebidas",
      title: b.title.trim() || "Bebidas del día",
      description: b.note.trim() || undefined,
      items: b.items,
      imageSide: "right",
    };
  }, [store.bebidas]);

  const navCategories = useMemo(() => {
    const list = [...store.categories];
    if (seasonalCategory) list.push(seasonalCategory);
    if (bebidasCategory) list.push(bebidasCategory);
    return list;
  }, [store.categories, seasonalCategory, bebidasCategory]);

  /** Bebidas disponibles para ofrecer en el carrito (máx. 4). Solo las que se pueden pedir hoy */
  const drinkSuggestions = useMemo(
    () => (bebidasCategory ? bebidasCategory.items.filter(isAvailable).slice(0, 4) : []),
    [bebidasCategory],
  );
  const comboItems = useMemo<MenuItem[]>(
    () => store.combos.map((combo) => ({ id: combo.id, name: combo.name, price: combo.price, unavailable: !combo.enabled })),
    [store.combos],
  );

  /** Cupón escrito por el cliente (persiste hasta que se envía el pedido) */
  const [appliedCode, setAppliedCode] = useLocalStorage<string>("egf-menu-coupon-v1", "");
  const appliedCoupon = useMemo<import("./utils/coupon").AppliedCoupon | null>(() => {
    const code = appliedCode.trim().toUpperCase();
    if (!code) return null;
    const coupon = store.coupons.find((c) => c.code === code) ?? null;
    if (!coupon)
      return { code, coupon: null, discount: 0, error: "Ese cupón no existe o ya no está disponible." };
    const error = couponError(coupon, cart.total);
    return { code, coupon, discount: error ? 0 : couponDiscount(coupon, cart.total), error };
  }, [appliedCode, store.coupons, cart.total]);

  const [view, setView] = useState<"splash" | "menu">("splash");
  const [cartOpen, setCartOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [comboSheet, setComboSheet] = useState<Combo | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [waterNoticeOpen, setWaterNoticeOpen] = useState(false);
  const [exitNoticeOpen, setExitNoticeOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const waterItems = useMemo(
    () =>
      (bebidasCategory?.items ?? []).filter(
        (item) => isAvailable(item) && /\b(agua|aguas|horchata|jamaica|tamarindo|limonada)\b/i.test(item.name),
      ),
    [bebidasCategory],
  );

  const notifications = useMemo<MenuNotification[]>(
    () => [
      ...store.coupons.map(makeCouponNotification).filter((notification): notification is MenuNotification => notification !== null),
      ...store.combos
        .filter((combo) => combo.enabled)
        .map((combo) => ({
          id: `combo-${combo.id}`,
          kind: "combo" as const,
          title: `${combo.name} disponible`,
          description: combo.description || "Arma tu combo favorito y agrégalo a tu pedido.",
        })),
      ...(waterItems.length > 0
        ? [{
            id: "water-of-the-day",
            kind: "water" as const,
            title: "Aguas del día",
            description: waterItems.map((item) => item.name).join(" · "),
          }]
        : []),
    ],
    [store.coupons, store.combos, waterItems],
  );

  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  // Ocultar la notificación al terminar su animación
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Aplicar los colores configurados a toda la página
  useEffect(() => {
    applyTheme(store.settings.theme);
  }, [store.settings.theme]);

  // Con el negocio cerrado el menú queda solo de consulta: se cierra el carrito
  const closed = !store.settings.open;
  useEffect(() => {
    if (closed) {
      setCartOpen(false);
      setSheet(null);
    }
  }, [closed]);

  useEffect(() => {
    if (view !== "menu" || cartOpen) return;
    const onPopState = () => {
      window.history.pushState({ ...(window.history.state ?? {}), egfMenu: true }, "", window.location.href);
      setExitNoticeOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [view, cartOpen]);

  // Mantener el carrito coherente si el administrador edita el menú
  // (incluye temporada: al desactivarla se retiran sus líneas del carrito)
  const { sync } = cart;
  useEffect(() => {
    sync(navCategories, comboItems);
  }, [navCategories, comboItems, sync]);

  /* ---- Pedido ---- */

  /** Botón "+" junto al precio: agrega directo o abre la hoja si hay extras */
  const handleQuickAdd = useCallback(
    (item: MenuItem, category: MenuCategory) => {
      if (item.unavailable) return;
      if (closed) {
        notify("Estamos cerrados por ahora · el menú es solo de consulta");
        return;
      }
      if (item.sizes?.length || availableExtras(item).length > 0) {
        setSheet({ item, category });
        return;
      }
      if (cart.qtyOf(item.id) > 0) cart.incrementItem(item.id);
      else cart.add(item, category);
      notify(`${item.cartName ?? item.name} agregado`);
    },
    [cart, notify, closed],
  );

  const handleOpen = useCallback((item: MenuItem, category: MenuCategory) => setSheet({ item, category }), []);

  const handleSheetAdd = useCallback(
    (selection: SheetSelection) => {
      if (!sheet) return;
      cart.add(sheet.item, sheet.category, selection);
      const name = sheet.item.cartName ?? sheet.item.name;
      const extrasText = selection.extras.length > 0 ? ` (${selection.extras.map((e) => e.name).join(", ")})` : "";
      notify(`${selection.qty > 1 ? `${selection.qty} × ` : ""}${name}${extrasText} agregado`);
      setSheet(null);
    },
    [sheet, cart, notify],
  );

  const handleComboAdd = useCallback((selections: ComboSelection[]) => {
    if (!comboSheet || closed) return;
    const category: MenuCategory = { id: "combos", title: "Combos", items: comboItems, imageSide: "right" };
    const item: MenuItem = { id: comboSheet.id, name: comboSheet.name, price: comboSheet.price };
    cart.add(item, category, { comboSelections: selections });
    notify(`${comboSheet.name} agregado`);
    setComboSheet(null);
  }, [comboSheet, comboItems, cart, closed, notify]);

  /* ---- Administración ---- */
  const openSecret = useCallback(() => {
    if (auth.authed) setAdminOpen(true);
    else setLoginOpen(true);
  }, [auth.authed]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const ok = await auth.login(email, password);
      if (ok) {
        setLoginOpen(false);
        setAdminOpen(true);
        notify("Sesión de administrador iniciada");
      }
      return ok;
    },
    [auth, notify],
  );

  const handleLogout = useCallback(() => {
    auth.logout();
    setAdminOpen(false);
    notify("Sesión cerrada");
  }, [auth, notify]);

  const handleReLogin = useCallback(() => {
    auth.logout();
    setAdminOpen(false);
    setLoginOpen(true);
  }, [auth]);

  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);
  const goToCombos = useCallback(() => {
    document.getElementById("combos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToWater = useCallback(() => {
    setWaterNoticeOpen(false);
    window.setTimeout(() => {
      document.getElementById("bebidas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

  const enterMenu = useCallback(() => {
    setView("menu");
    window.history.pushState({ ...(window.history.state ?? {}), egfMenu: true }, "", window.location.href);
    const hasWaterNotice = waterItems.length > 0;
    setWaterNoticeOpen(hasWaterNotice);
  }, [waterItems.length]);

  return (
    <>
      {view === "splash" ? (
        <SplashScreen
          settings={store.settings}
          authed={auth.authed}
          isLoading={store.isLoading}
          onEnter={enterMenu}
          onAdminEnter={() => setAdminOpen(true)}
          onSecret={openSecret}
        />
      ) : (
    <div className="min-h-screen bg-paper-dark/40 md:py-6">
      {/* Póster del menú */}
      <div className="relative mx-auto min-h-screen max-w-[1100px] overflow-clip bg-paper md:min-h-0 md:rounded-[1.75rem] md:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] md:ring-1 md:ring-black/5">
        {/* Mancha inferior derecha */}
        <Blob flip className="absolute bottom-0 right-0 w-[52vw] max-w-[360px]" />
        <div className="paper-grain" aria-hidden="true" />

        <div className="relative z-10">
          {auth.authed && <AdminBar open={store.settings.open} onEdit={() => setAdminOpen(true)} onLogout={handleLogout} />}

          <Header settings={store.settings} onSecret={openSecret} />

          <main className="px-4 pb-4 pt-6 sm:px-8 md:px-14 md:pt-8">
            {closed && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-red-300 bg-red-50/80 px-4 py-3 text-xs text-ink/75 sm:text-sm">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p>
                  <span className="font-bold text-red-700">Cerrado por ahora.</span> Puedes ver el menú con
                  calma; los pedidos se habilitan en cuanto abramos. ¡Gracias por tu preferencia! 💛
                </p>
              </div>
            )}
            <CategoryNav categories={navCategories} className={auth.authed ? "top-11" : "top-0"} />

            <div className="space-y-12 md:space-y-16">
              {store.categories.map((category) => (
                <MenuSection
                  key={category.id}
                  category={category}
                  qtyOf={cart.qtyOf}
                  closed={closed}
                  onQuickAdd={handleQuickAdd}
                  onOpen={handleOpen}
                  onDecrement={cart.decrementItem}
                />
              ))}
              {seasonalCategory && (
                <SeasonalBand
                  category={seasonalCategory}
                  qtyOf={cart.qtyOf}
                  closed={closed}
                  onQuickAdd={handleQuickAdd}
                  onOpen={handleOpen}
                  onDecrement={cart.decrementItem}
                />
              )}
              {bebidasCategory && (
                <BebidasBand
                  category={bebidasCategory}
                  qtyOf={cart.qtyOf}
                  closed={closed}
                  onQuickAdd={handleQuickAdd}
                  onOpen={handleOpen}
                  onDecrement={cart.decrementItem}
                />
              )}
              <ComboBand combos={store.combos} closed={closed} qtyOf={cart.qtyOf} onOpen={setComboSheet} />
              {store.categories.length === 0 && !seasonalCategory && !bebidasCategory && (
                <p className="py-16 text-center text-lg text-ink/60">
                  Estamos preparando el menú. ¡Vuelve pronto! 🌮
                </p>
              )}
            </div>
          </main>

          <div className="pb-28 md:pb-24">
            <Footer settings={store.settings} />
          </div>
        </div>

        {/* Botón oculto de administración (esquina inferior izquierda del menú) */}
        <button
          type="button"
          onClick={openSecret}
          aria-label="Acceso administrador"
          title="Administrar"
          className="absolute bottom-0 left-0 z-20 grid h-12 w-12 place-items-center rounded-tr-2xl text-ink/60 opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
        >
          <LockIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
      )}

      {view === "menu" && !closed && (
        <CartButton
          count={cart.count}
          total={Math.max(0, cart.total - (appliedCoupon?.discount ?? 0))}
          onOpen={() => setCartOpen(true)}
        />
      )}
      <Toast toast={toast} />

      {exitNoticeOpen && view === "menu" && !cartOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-notice-title"
            className="w-full max-w-sm rounded-3xl bg-paper/90 p-7 text-center shadow-2xl ring-1 ring-white/50"
          >
            <div className="text-6xl" aria-hidden="true">😔</div>
            <h2 id="exit-notice-title" className="mt-4 text-xl font-bold text-ink">
              No te vayas todavía
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Tu menú sigue aquí. Cierra este mensaje para continuar eligiendo tu antojo.
            </p>
            <button
              type="button"
              onClick={() => setExitNoticeOpen(false)}
              className="mt-5 w-full rounded-full bg-ink px-5 py-3 font-bold text-paper transition hover:opacity-90"
            >
              Seguir en el menú
            </button>
          </section>
        </div>
      )}

      {view === "menu" && (
        <NotificationCenter
          notifications={notifications}
          onUseCoupon={(code) => {
            setAppliedCode(code);
            setCartOpen(true);
            notify(`Cupón ${code} listo para usar`);
          }}
          onGoToCombos={goToCombos}
          onGoToWater={goToWater}
        />
      )}

      {sheet && (
        <ItemSheet
          key={sheet.item.id}
          item={sheet.item}
          category={sheet.category}
          closed={closed}
          onClose={closeSheet}
          onAdd={handleSheetAdd}
        />
      )}

      {comboSheet && (
        <ComboSheet combo={comboSheet} closed={closed} onClose={() => setComboSheet(null)} onAdd={handleComboAdd} />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        cart={cart}
        customer={customer}
        onCustomerChange={setCustomer}
        settings={store.settings}
        closed={closed}
        onSent={() => {
          setAppliedCode("");
          void new Audio(notificationSound).play().catch(() => undefined);
          notify("Pedido enviado · carrito listo para uno nuevo");
        }}
        suggestions={drinkSuggestions}
        onAddSuggestion={(item) => bebidasCategory && handleOpen(item, bebidasCategory)}
        appliedCoupon={appliedCoupon}
        onApplyCode={(code) => {
          setAppliedCode(code ?? "");
          if (code) {
            const c = store.coupons.find((x) => x.code === code);
            notify(c ? `Cupón ${code} aplicado` : `Cupón ${code} no válido`);
          }
        }}
        onRedeemCoupon={store.redeemCoupon}
      />

      {loginOpen && (
        <AdminLogin onClose={closeLogin} onLogin={handleLogin} isDefaultPassword={auth.isDefaultPassword} />
      )}

      {adminOpen && auth.authed && (
        <AdminPanel store={store} auth={auth} onClose={closeAdmin} onLogout={handleLogout} onReLogin={handleReLogin} notify={notify} />
      )}
      {waterNoticeOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/55 px-4 py-6 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="water-notice-title"
            className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[1.75rem] bg-paper p-5 text-center shadow-2xl ring-1 ring-black/10 sm:p-7"
          >
            <button
              type="button"
              onClick={() => setWaterNoticeOpen(false)}
              aria-label="Cerrar aviso de aguas"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink/55 transition hover:bg-ink/8 hover:text-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <img
              src={waterImage}
              alt="Aguas frescas del día"
              className="mx-auto h-36 w-full rounded-2xl object-cover object-center sm:h-44"
            />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">El Agua de hoy es</p>
            <h2 id="water-notice-title" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
              
            </h2>
            <ul className="mt-4 space-y-2 text-left">
              {waterItems.map((item) => (
                <li key={item.id} className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-ink/8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">{item.name}</span>
                    <span className="shrink-0 text-sm font-bold text-sky-700">
                      {item.sizes?.length ? `Desde $${Math.min(...item.sizes.map((size) => size.price))}` : `$${item.price}`}
                    </span>
                  </div>
                  {item.sizes?.length ? (
                    <p className="mt-1 text-xs text-ink/60">
                      {item.sizes.map((size) => `${size.name} $${size.price}`).join(" · ")}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setWaterNoticeOpen(false);
                      if (bebidasCategory) handleQuickAdd(item, bebidasCategory);
                    }}
                    disabled={closed}
                    className="mt-3 w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {closed ? "No disponible ahora" : "Agregar al pedido"}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setWaterNoticeOpen(false)}
              className="mt-5 w-full rounded-full bg-ink px-5 py-3 font-bold text-paper transition hover:opacity-90"
            >
              Ver el menú
            </button>
          </section>
        </div>
      )}
    </>
  );
}
