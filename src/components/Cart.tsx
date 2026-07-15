import { useState } from 'react';
import { Copy, X, Minus, Plus, MessageCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { DEFAULT_PRODUCT_IMAGE, handleProductImageError } from '../utils/images';
import { defaultWhatsAppOrderMessage } from '../data';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { config } = useMenu();
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [transferNumberCopied, setTransferNumberCopied] = useState(false);

  if (!isOpen) return null;

  const buildOrderDetails = () => {
    return items
      .map((item) => {
        const basePrice = item.selectedSize?.price ?? item.product.price;
        const complementsPrice = item.selectedComplements.reduce((sum, c) => sum + c.price, 0);
        const itemSubtotal = (basePrice + complementsPrice) * item.quantity;

        let details = `▪️ *${item.quantity}x ${item.product.name}* - $${itemSubtotal.toFixed(2)}`;
        if (item.selectedSize) {
          details += `\n   ↳ _Presentación:_ ${item.selectedSize.name}`;
        }
        if (item.selectedComplements && item.selectedComplements.length > 0) {
          const compNames = item.selectedComplements.map(c => c.price > 0 ? `${c.name} (+$${c.price})` : c.name).join(', ');
          details += `\n   ↳ _Extras/Opciones:_ ${compNames}`;
        }

        return details;
      })
      .join('\n\n');
  };

  const buildOrderMessage = () => {
    const template = config.socialMedia?.whatsappOrderMessage || defaultWhatsAppOrderMessage;
    const receiptMessage = config.socialMedia?.transferReceiptMessage?.trim() || 'Por favor comparte tu comprobante por WhatsApp.';
    const hasPaymentInstructionsPlaceholder = template.includes('{paymentInstructions}');
    const paymentInstructions = paymentMethod === 'Transferencia' ? receiptMessage : '';
    let message = template
      .replaceAll('{businessName}', config.name)
      .replaceAll('{orderDetails}', buildOrderDetails())
      .replaceAll('{paymentMethod}', paymentMethod)
      .replaceAll('{paymentInstructions}', paymentInstructions)
      .replaceAll('{total}', `$${total.toFixed(2)}`)
      .replaceAll('{phone}', `+${config.phone}`);

    if (paymentMethod === 'Transferencia' && !hasPaymentInstructionsPlaceholder) {
      message += `\n\n_${receiptMessage}_`;
    }

    return message;
  };

  const transferBank = config.socialMedia?.transferBank?.trim() || 'Banco no configurado';
  const transferHolder = config.socialMedia?.transferAccountHolder?.trim() || 'Titular no configurado';
  const transferAccountNumber = config.socialMedia?.transferAccountNumber?.trim() || 'Número no configurado';
  const transferReceiptMessage = config.socialMedia?.transferReceiptMessage?.trim() || 'Por favor comparte tu comprobante por WhatsApp.';

  const copyTransferNumber = async () => {
    if (!transferAccountNumber || transferAccountNumber === 'Número no configurado') {
      alert('No hay un número de cuenta configurado.');
      return;
    }

    try {
      await navigator.clipboard.writeText(transferAccountNumber);
      setTransferNumberCopied(true);
      setTimeout(() => setTransferNumberCopied(false), 2500);
    } catch {
      alert(transferAccountNumber);
    }
  };

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    if (!config.isOpen) {
      alert("¡Hola! En este momento el negocio está CERRADO y no podemos recibir pedidos por WhatsApp. Por favor, revisa nuestros horarios.");
      return;
    }

    const text = buildOrderMessage();

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
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Forma de pago
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-orange-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            {paymentMethod === 'Transferencia' && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Datos para transferencia</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{transferBank}</p>
                    <p className="text-xs text-gray-600">Titular: {transferHolder}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyTransferNumber}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{transferNumberCopied ? 'Copiado' : 'Copiar número'}</span>
                  </button>
                </div>

                <div className="rounded-xl bg-white border border-blue-100 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Número de cuenta</p>
                  <p className="font-mono text-sm sm:text-base font-extrabold text-gray-900 break-all mt-1">{transferAccountNumber}</p>
                </div>

                <p className="text-xs text-blue-800 font-medium">
                  {transferReceiptMessage}
                </p>
              </div>
            )}

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
