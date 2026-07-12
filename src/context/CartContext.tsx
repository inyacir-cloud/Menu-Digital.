import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product, Complement, SizeOption } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedComplements?: Complement[], selectedSize?: SizeOption) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Generate a unique ID based on product ID, sorted complement IDs, and size
  const generateCartItemId = (productId: string, complements: Complement[] = [], selectedSize?: SizeOption) => {
    const sizePart = selectedSize ? selectedSize.name : '';
    if (complements.length === 0 && !sizePart) return productId;
    const sortedIds = [...complements].map(c => c.id).sort().join('_');
    return `${productId}_${sizePart}_${sortedIds}`;
  };

  const addToCart = (product: Product, selectedComplements: Complement[] = [], selectedSize?: SizeOption) => {
    const cartItemId = generateCartItemId(product.id, selectedComplements, selectedSize);

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === cartItemId);
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...currentItems,
        {
          id: cartItemId,
          product,
          quantity: 1,
          selectedComplements,
          selectedSize,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  // Calculate total: (selectedSize?.price || product.price + sum(complements.price)) * quantity
  const total = items.reduce((sum, item) => {
    const basePrice = item.selectedSize?.price ?? item.product.price;
    const complementsPrice = item.selectedComplements.reduce((cSum, comp) => cSum + comp.price, 0);
    const itemUnitPrice = basePrice + complementsPrice;
    return sum + itemUnitPrice * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
