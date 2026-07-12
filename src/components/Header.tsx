import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';

interface HeaderProps {
  onOpenCart: () => void;
}

export function Header({ onOpenCart }: HeaderProps) {
  const { items } = useCart();
  const { config } = useMenu();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const businessName = config.name || 'El Gordo & La Flaca';

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.logo ? (
            <img src={config.logo} alt={businessName} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-white" />
          ) : null}
          <h1 className="text-xl font-bold text-gray-800 truncate">{businessName}</h1>
        </div>
        
        <button
          onClick={onOpenCart}
          className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
