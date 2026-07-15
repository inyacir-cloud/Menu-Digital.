import { X, Minus, Plus, MessageCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { DEFAULT_PRODUCT_IMAGE, handleProductImageError } from '../utils/images';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { config } = useMenu();

  if (!isOpen) return null;

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    if (!config.isOpen) {
      alert("¡Hola! En este momento el negocio está CERRADO y no podemos recibir pedidos por WhatsApp. Por favor, revisa nuestros horarios.");
      return;
    }

    let text = `*¡Hola! Quisiera hacer un pedido a ${config.name}:*\n\n`;
    
    items.forEach((item) => {
      const basePrice = item.selectedSize?.price ?? item.product.price;
      const complementsPrice = item.selectedComplements.reduce((sum, c) => sum + c.price, 0);
      const itemSubtotal = (basePrice + complementsPrice) * item.quantity;
      
      text += `▪️ *${item.quantity}x ${item.product.name}* - $${itemSubtotal.toFixed(2)}\n`;
      if (item.selectedSize) {
        text += `   ↳ _Presentación:_ ${item.selectedSize.name}\n`;
      }
      if (item.selectedComplements && item.selectedComplements.length > 0) {
        const compNames = item.selectedComplements.map(c => c.price > 0 ? `${c.name} (+$${c.price})` : c.name).join(', ');
        text += `   ↳ _Extras/Opciones:_ ${compNames}\n`;
      }
    });

    text += `\n*TOTAL A PAGAR: $${total.toFixed(2)}*`;
    text += `\n\n_Por favor confirmar tiempo estimado de entrega y método de pago. ¡Gracias!_`;

    // Clean phone number (remove spaces, dashes, plus signs)
    const cleanPhone = config.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-slideRight" style={{ maxHeight: '100dvh' }}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-white safe-top">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Tu Pedido</h2>
            {items.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                title="Vaciar carrito"
                className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Warning Banner inside Cart if Closed */}
        {!config.isOpen && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>El negocio está cerrado actualmente. El botón para pedir por WhatsApp estará deshabilitado o mostrará aviso.</span>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 slim-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <MessageCircle className="w-10 h-10 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-600">Tu carrito está vacío</p>
                <p className="text-xs text-gray-400 mt-1">Explora nuestro menú digital y agrega platillos</p>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const basePrice = item.selectedSize?.price ?? item.product.price;
              const complementsPrice = item.selectedComplements.reduce((sum, c) => sum + c.price, 0);
              const itemTotal = (basePrice + complementsPrice) * item.quantity;

              return (
                <div key={item.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 transition-colors">
                  <img 
                    src={item.product.image || DEFAULT_PRODUCT_IMAGE} 
                    alt={item.product.name}
                    onError={handleProductImageError}
                    className="w-20 h-20 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.product.name}</h4>
                        <span className="text-orange-500 font-extrabold text-sm ml-1">
                          ${itemTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Display Selected Size (e.g. Litro / Medio Litro) */}
                      {item.selectedSize && (
                        <div className="mt-1">
                          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                            {item.selectedSize.name} — ${item.selectedSize.price.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Display Selected Complements */}
                      {item.selectedComplements && item.selectedComplements.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedComplements.map((c) => (
                            <span 
                              key={c.id} 
                              className="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                            >
                              + {c.name} {c.price > 0 && `($${c.price})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-500 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-gray-700 min-w-[1.2rem] text-center text-xs">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-500 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with WhatsApp Order Button */}
        {items.length > 0 && (
          <div className="border-t bg-white p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-lg safe-bottom">
            <div className="flex justify-between items-center text-base sm:text-lg font-extrabold text-gray-800">
              <span>Total a pagar</span>
              <span className="text-xl sm:text-2xl text-orange-500">${total.toFixed(2)}</span>
            </div>
            
            <button
              onClick={handleWhatsAppOrder}
              disabled={!config.isOpen}
              className={`w-full font-bold py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base ${
                config.isOpen
                  ? 'bg-[#25D366] hover:bg-[#1fbe5a] active:bg-[#128C7E] text-white shadow-green-200 transform active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
              }`}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{config.isOpen ? 'Pedir por WhatsApp' : 'Negocio Cerrado'}</span>
            </button>
            
            <p className="text-[10px] sm:text-[11px] text-center text-gray-400">
              Serás redirigido a WhatsApp con tu pedido listo · +{config.phone}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
