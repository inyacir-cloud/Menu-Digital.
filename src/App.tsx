import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerInfo, MenuCategory, MenuItem } from "./types";
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
import { SplashScreen } from "./components/SplashScreen";
import { Footer } from "./components/Footer";
import { CartButton } from "./components/CartButton";
import { CartDrawer } from "./components/CartDrawer";
import { ItemSheet, type SheetSelection } from "./components/ItemSheet";
import { Toast, type ToastData } from "./components/Toast";
import { LockIcon } from "./components/icons";
import { AdminBar } from "./components/admin/AdminBar";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

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

  // Mantener el carrito coherente si el administrador edita el menú
  // (incluye temporada: al desactivarla se retiran sus líneas del carrito)
  const { sync } = cart;
  useEffect(() => {
    sync(navCategories);
  }, [navCategories, sync]);

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

  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);

  return (
    <>
      {view === "splash" ? (
        <SplashScreen
          settings={store.settings}
          authed={auth.authed}
          onEnter={() => setView("menu")}
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
        <AdminPanel store={store} auth={auth} onClose={closeAdmin} onLogout={handleLogout} notify={notify} />
      )}
    </>
  );
}
