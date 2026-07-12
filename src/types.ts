export interface SizeOption {
  name: string;
  price: number;
}

export interface Complement {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  complementIds?: string[]; // IDs of complements available for this product
  isDailyWater?: boolean; // Identifies if it is a daily fresh water / sabor del día
  isAvailable?: boolean; // Defaults to true, can be toggled off for items out of stock today
  sizes?: SizeOption[]; // Optional size variants (e.g., Litro $35, Medio Litro $25)
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder?: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (product.id + complements + size)
  product: Product;
  quantity: number;
  selectedComplements: Complement[];
  selectedSize?: SizeOption;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface BusinessConfig {
  name: string;
  isOpen: boolean;
  phone: string;
  schedule: string; // General schedule (legacy)
  address?: string;
  description?: string;
  logo?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  serviceType?: 'delivery' | 'pickup' | 'both';
  deliveryRadius?: string;
  hours?: BusinessHours;
}
