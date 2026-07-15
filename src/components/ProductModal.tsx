import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, Complement, SizeOption } from '../types';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { DEFAULT_PRODUCT_IMAGE, handleProductImageError } from '../utils/images';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { complements } = useMenu();
  const { addToCart } = useCart();
  const [selectedComplements, setSelectedComplements] = useState<Complement[]>([]);
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset state when product changes and auto-select first size
  useEffect(() => {
    if (isOpen && product) {
      setSelectedComplements([]);
      setQuantity(1);
      // Auto-select first size if available
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize(null);
      }
    }
  }, [product?.id, isOpen]);

  if (!isOpen || !product) return null;

  // Find complements assigned to this product
  // - isDailyWater = never has complements
  // - complementIds === undefined = show all (legacy/backward compatible)
  // - complementIds = [] = no complements
  // - complementIds = ['c1', 'c2'] = only those
  let availableComplements: Complement[] = [];
  if (product.isDailyWater) {
    availableComplements = [];
  } else if (product.complementIds === undefined) {
    availableComplements = complements;
  } else if (Array.isArray(product.complementIds) && product.complementIds.length > 0) {
    availableComplements = complements.filter(c => product.complementIds?.includes(c.id));
  } else {
    availableComplements = []; // empty array = no complements
  }

  const hasSizes = product.sizes && product.sizes.length > 0;
  const basePrice = selectedSize?.price ?? product.price;
  const complementsPrice = selectedComplements.reduce((sum, c) => sum + c.price, 0);
  const unitPrice = basePrice + complementsPrice;
  const totalPrice = unitPrice * quantity;

  const toggleComplement = (complement: Complement) => {
    setSelectedComplements(prev => {
      const exists = prev.some(c => c.id === complement.id);
      if (exists) {
        return prev.filter(c => c.id !== complement.id);
      } else {
        return [...prev, complement];
      }
    });
  };

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedComplements, selectedSize || undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-slideUp sm:animate-fadeIn" 
        style={{ maxHeight: '92dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header Image */}
        <div className="relative h-44 sm:h-56 w-full bg-gray-100 shrink-0">
          <img
            src={product.image || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            onError={handleProductImageError}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6 slim-scrollbar">
          {/* Product info */}
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h3>
              </div>
              {!hasSizes && (
                <span className="text-xl sm:text-2xl font-black text-orange-500 whitespace-nowrap shrink-0">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* SIZE SELECTOR */}
          {hasSizes && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-bold text-gray-800 mb-1">Selecciona tamaño / presentación</h4>
              <p className="text-xs text-gray-400 mb-3">Elige la cantidad que prefieras</p>

              <div className="grid grid-cols-2 gap-3">
                {product.sizes!.map((s, i) => {
                  const isSelected = selectedSize?.name === s.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <span className={`block font-bold text-sm ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                        {s.name}
                      </span>
                      <span className={`block text-lg font-extrabold mt-0.5 ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                        ${s.price.toFixed(2)}
                      </span>
                      {isSelected && (
                        <span className="block mt-1">
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-200/50 px-1.5 py-0.5 rounded-md">
                            <Check className="w-3 h-3" />
                            Seleccionado
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPLEMENTS */}
          {availableComplements.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-bold text-gray-800 mb-1">Elige tus complementos</h4>
              <p className="text-xs text-gray-400 mb-3">Personaliza tu platillo a tu gusto</p>
              
              <div className="space-y-2">
                {availableComplements.map(comp => {
                  const isSelected = selectedComplements.some(c => c.id === comp.id);
                  return (
                    <div
                      key={comp.id}
                      onClick={() => toggleComplement(comp)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-medium shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-sm">{comp.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${comp.price > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {comp.price > 0 ? `+$${comp.price.toFixed(2)}` : 'Gratis'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className={`${availableComplements.length > 0 || hasSizes ? 'border-t border-gray-100' : ''} pt-4 flex items-center justify-between`}>
            <span className="font-bold text-gray-800 text-sm">Cantidad</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-orange-500 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-800 min-w-[1.5rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-orange-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Add Button */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 shrink-0 safe-bottom">
          <button
            onClick={handleAdd}
            disabled={hasSizes && !selectedSize}
            className={`w-full font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg flex items-center justify-between px-4 sm:px-6 transition-all transform active:scale-[0.98] text-sm sm:text-base ${
              hasSizes && !selectedSize
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-orange-200'
            }`}
          >
            <span>
              {hasSizes && !selectedSize 
                ? 'Selecciona un tamaño' 
                : 'Agregar al pedido'
              }
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-black ${
              hasSizes && !selectedSize ? 'bg-gray-300 text-gray-500' : 'bg-orange-600'
            }`}>
              ${totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
