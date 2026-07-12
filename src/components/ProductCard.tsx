import { Plus } from 'lucide-react';
import { Product } from '../types';
import { handleProductImageError } from '../utils/images';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const hasSizes = product.sizes && product.sizes.length > 0;

  return (
    <div 
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-200 cursor-pointer group active:scale-[0.98]"
    >
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={handleProductImageError}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Tags */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 flex flex-wrap gap-1.5">
          {hasSizes && (
            <span className="bg-blue-500/80 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
              {product.isDailyWater ? '🍹 Litro / ½ L' : 'Varios tamaños'}
            </span>
          )}
          {!hasSizes && product.complementIds && product.complementIds.length > 0 && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
              + Personalizable
            </span>
          )}
        </div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
          <h3 className="font-bold text-gray-800 leading-tight text-sm sm:text-base group-hover:text-orange-500 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price display */}
        {hasSizes ? (
          <div className="mb-1.5 sm:mb-2 space-y-0.5">
            {product.sizes!.map((s, i) => (
              <span key={i} className="block text-xs sm:text-sm font-semibold text-gray-700">
                <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{s.name}:</span>{' '}
                <span className="font-extrabold text-orange-500">${s.price.toFixed(2)}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="font-extrabold text-orange-500 text-base sm:text-lg mb-1.5 block">
            ${product.price.toFixed(2)}
          </span>
        )}

        <p className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4 flex-grow line-clamp-2 leading-relaxed hidden sm:block">
          {product.description}
        </p>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="w-full bg-orange-50 group-hover:bg-orange-500 text-orange-600 group-hover:text-white active:bg-orange-600 active:text-white font-semibold py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 mt-auto text-xs sm:text-sm shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="sm:hidden">Agregar</span>
          <span className="hidden sm:inline">Agregar / Opciones</span>
        </button>
      </div>
    </div>
  );
}
