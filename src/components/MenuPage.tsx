import { useState, useMemo } from 'react';
import { ShoppingCart, Utensils, Clock, MapPin, AtSign, Share2, Globe, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { CategoryList } from './CategoryList';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { Cart } from './Cart';
import { Product } from '../types';

export function MenuPage() {
  const { categories, products, config } = useMenu();
  const { itemCount } = useCart();

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showClosedOverlay, setShowClosedOverlay] = useState(true);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);

  const currentCategoryId = categories.some(c => c.id === activeCategory)
    ? activeCategory
    : (categories[0]?.id || '');

  const filteredProducts = useMemo(() => 
    products.filter(p => p.categoryId === currentCategoryId && p.isAvailable !== false),
  [products, currentCategoryId]);

  const dayLabels: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  };
  const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ============================================ */}
      {/* FULL-SCREEN CLOSED OVERLAY */}
      {/* ============================================ */}
      {!config.isOpen && showClosedOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred dark backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          
          {/* Main Card */}
          <div className="relative w-full max-w-md animate-fadeIn">
            {/* Glow effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-br from-orange-400/30 via-red-400/20 to-purple-400/30 rounded-[2rem] blur-xl" />
            
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Top gradient header */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 pt-10 pb-8 text-center overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-500/10 rounded-full translate-x-1/3 translate-y-1/3" />
                
                {/* Closed icon */}
                <div className="relative mx-auto mb-5">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 rotate-3">
                    <span className="text-4xl">🚫</span>
                  </div>
                </div>

                <h2 className="relative text-2xl font-extrabold text-white mb-2">
                  Cerrado temporalmente
                </h2>
                <p className="relative text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Disculpa las molestias, en este momento no estamos en servicio. ¡Te esperamos pronto!
                </p>
              </div>

              {/* Message & Dismiss */}
              <div className="px-8 py-6 text-center">
                {/* Dismiss button */}
                <button
                  onClick={() => setShowClosedOverlay(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Ver la carta de todos modos</span>
                  <X className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-gray-400 mt-3">
                  Puedes explorar el menú, pero los pedidos estarán deshabilitados
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {config.logo ? (
              <img src={config.logo} alt={config.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-md shrink-0" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-orange-200 shrink-0">
                {config.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-800 leading-tight truncate">{config.name}</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5 hidden xs:block">Menú Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge - Compact on mobile */}
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold ${
              config.isOpen 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`relative flex h-2 w-2 sm:h-2.5 sm:w-2.5`}>
                {config.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${config.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="hidden sm:inline">{config.isOpen ? 'ABIERTO' : 'CERRADO'}</span>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Abrir carrito"
              className="relative p-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-200 transition-all flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold text-sm hidden md:inline">Pedido</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] sm:text-xs font-black rounded-full min-w-[1.25rem] h-5 sm:min-w-[1.5rem] sm:h-6 flex items-center justify-center border-2 border-white shadow-sm px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Open banner */}
        {config.isOpen && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 sm:px-4 py-2">
            <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs sm:text-sm font-medium">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white"></span>
              </span>
              <span className="truncate">
                <span className="sm:hidden">¡Abierto · Recibiendo pedidos!</span>
                <span className="hidden sm:inline">¡Estamos abiertos! Recibiendo pedidos ahora · {config.schedule}</span>
              </span>
            </div>
          </div>
        )}

        {/* Closed thin bar */}
        {!config.isOpen && !showClosedOverlay && (
          <button
            onClick={() => setShowClosedOverlay(true)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-semibold hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-colors cursor-pointer"
          >
            🚫 Cerrado temporalmente · Toca aquí
          </button>
        )}
      </header>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-6">
        <div className="mb-4 sm:mb-6 px-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">Nuestra Carta</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Selecciona una categoría y personaliza tu pedido</p>
        </div>

        {/* Categories Bar - Sticky under header */}
        {categories.length > 0 ? (
          <div className="sticky top-[3.5rem] sm:top-[4rem] bg-gray-50 z-10 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-3 sm:pb-4">
            <CategoryList 
              categories={categories}
              activeCategory={currentCategoryId}
              onSelectCategory={setActiveCategory}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No hay categorías disponibles.</p>
        )}

        {/* Products Grid - Responsive columns */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mt-3 sm:mt-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-gray-100 p-6 sm:p-8">
              <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm sm:text-base">No hay platillos en esta categoría</p>
              <p className="text-xs text-gray-400 mt-1">Pronto agregaremos más opciones</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Cart Button (Mobile) - Shows when items in cart */}
      {itemCount > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-5 rounded-full shadow-2xl shadow-orange-500/40 flex items-center gap-3 sm:hidden animate-slideUp safe-bottom"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-black">
            {itemCount}
          </span>
          <span className="text-sm">Ver mi pedido</span>
          <ShoppingCart className="w-4 h-4" />
        </button>
      )}

      {/* ============================================ */}
      {/* BUSINESS INFO SECTION */}
      {/* ============================================ */}
      <section className="max-w-5xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowBusinessDetails((prev) => !prev)}
            className="w-full px-5 sm:px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-between hover:from-orange-600 hover:to-orange-700 transition-colors"
          >
            <span className="text-sm sm:text-base font-semibold">Ver ubicación, horarios, servicios y redes</span>
            {showBusinessDetails ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
          </button>

          {showBusinessDetails && (
            <>
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 border-t border-gray-100">
                {/* Ubicación y Servicio */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">Ubicación</h4>
                      <p className="text-sm text-gray-600 mt-0.5">{config.address || 'No especificada'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">Tipo de Servicio</h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {config.serviceType === 'pickup' && 'Solo para recoger'}
                        {config.serviceType === 'delivery' && 'Solo servicio a domicilio'}
                        {config.serviceType === 'both' && 'Domicilio y recoger en local'}
                        {!config.serviceType && 'No especificado'}
                      </p>
                      {config.deliveryRadius && (
                        <p className="text-xs text-gray-500 mt-0.5">Radio de entrega: {config.deliveryRadius}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horarios Detallados */}
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm mb-3">Horarios de Atención</h4>
                      
                      {config.hours ? (
                        <div className="space-y-1.5 text-xs">
                          {orderedDays.map((day) => {
                            const hours = config.hours?.[day as keyof typeof config.hours] || '';
                            const isClosed = hours?.toLowerCase().includes('cerrado') || hours === '';
                            return (
                              <div key={day} className="flex justify-between items-center">
                                <span className="font-semibold text-gray-600">{dayLabels[day]}</span>
                                <span className={isClosed ? 'text-red-500' : 'text-gray-800'}>
                                  {hours || 'No definido'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{config.schedule}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              {config.socialMedia && (
                config.socialMedia.instagram || config.socialMedia.facebook || config.socialMedia.website
              ) && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Síguenos en redes</h4>
                  <div className="flex flex-wrap gap-3">
                    {config.socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${config.socialMedia.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                        <span>@{config.socialMedia.instagram.replace('@', '')}</span>
                      </a>
                    )}
                    {config.socialMedia.facebook && (
                      <a
                        href={`https://facebook.com/${config.socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{config.socialMedia.facebook}</span>
                      </a>
                    )}
                    {config.socialMedia.website && (
                      <a
                        href={config.socialMedia.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Sitio Web</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {config.name} · Menú Digital
        </p>
      </footer>

      {/* Product Customization Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Cart Drawer */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
