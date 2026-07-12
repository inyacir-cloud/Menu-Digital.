import { Category, Product, Complement, BusinessConfig } from './types';

export const initialConfig: BusinessConfig = {
  name: 'El Gordo & La Flaca',
  isOpen: true,
  phone: '525635397099',
  schedule: 'Mar - Dom: 1:00 PM - 11:00 PM',
  address: 'Av. Principal #123, Centro, Ciudad de México',
  description: 'Antojitos mexicanos con sabor casero, porciones generosas y pedidos directos por WhatsApp.',
  logo: '/Logo.png',
  socialMedia: {
    instagram: 'elgordoylaflaca',
    facebook: 'elgordoylaflaca',
    website: ''
  },
  serviceType: 'both',
  deliveryRadius: '5 km',
  hours: {
    monday: 'Cerrado',
    tuesday: '1:00 PM - 11:00 PM',
    wednesday: '1:00 PM - 11:00 PM',
    thursday: '1:00 PM - 11:00 PM',
    friday: '1:00 PM - 12:00 AM',
    saturday: '12:00 PM - 12:00 AM',
    sunday: '12:00 PM - 10:00 PM'
  }
};

export const initialCategories: Category[] = [
  { id: '1', name: 'Hamburguesas', sortOrder: 0 },
  { id: '2', name: 'Pizzas', sortOrder: 1 },
  { id: '3', name: 'Bebidas', sortOrder: 2 },
  { id: '4', name: 'Postres', sortOrder: 3 },
];

export const initialComplements: Complement[] = [
  { id: 'c1', name: 'Queso Cheddar Extra', price: 15 },
  { id: 'c2', name: 'Tocino Crujiente', price: 20 },
  { id: 'c3', name: 'Carne Extra (Patty)', price: 40 },
  { id: 'c4', name: 'Sin Cebolla', price: 0 },
  { id: 'c5', name: 'Sin Tomate', price: 0 },
  { id: 'c6', name: 'Orilla de Queso', price: 35 },
  { id: 'c7', name: 'Champiñones Extra', price: 15 },
  { id: 'c8', name: 'Salsa Picante Habanero', price: 10 },
  { id: 'c9', name: 'Helado Extra', price: 20 }
];

export const initialProducts: Product[] = [
  {
    id: 'p1',
    categoryId: '1',
    name: 'Hamburguesa Clásica',
    description: 'Carne de res 150g, lechuga, tomate, queso y nuestra salsa especial.',
    price: 85.00,
    image: '/Logo.png',
    complementIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c8']
  },
  {
    id: 'p2',
    categoryId: '1',
    name: 'Doble Bacon Cheeseburger',
    description: 'Doble carne de res, doble queso cheddar, tocino crujiente y cebolla caramelizada.',
    price: 130.00,
    image: '/Logo.png',
    complementIds: ['c1', 'c2', 'c3', 'c4', 'c8']
  },
  {
    id: 'p3',
    categoryId: '2',
    name: 'Pizza Margarita Artesanal',
    description: 'Salsa de tomate casera, mozzarella fresca, albahaca y aceite de oliva.',
    price: 160.00,
    image: '/Logo.png',
    complementIds: ['c6', 'c7', 'c8']
  },
  {
    id: 'p4',
    categoryId: '2',
    name: 'Pizza Pepperoni Especial',
    description: 'Abundante pepperoni importado, doble queso mozzarella y salsa tradicional.',
    price: 185.00,
    image: '/Logo.png',
    complementIds: ['c6', 'c7', 'c8']
  },
  {
    id: 'p5',
    categoryId: '3',
    name: 'Coca Cola Original',
    description: 'Lata bien fría de 355ml.',
    price: 30.00,
    image: '/Logo.png',
    complementIds: []
  },
  {
    id: 'p6',
    categoryId: '3',
    name: 'Limonada Casera con Menta',
    description: 'Refrescante limonada natural preparada al momento con hojas de menta.',
    price: 35.00,
    image: '/Logo.png',
    complementIds: [],
    isDailyWater: true,
    isAvailable: true,
    sizes: [
      { name: 'Litro', price: 35.00 },
      { name: 'Medio Litro', price: 25.00 }
    ]
  },
  {
    id: 'p6_2',
    categoryId: '3',
    name: 'Horchata Artesanal',
    description: 'Tradicional horchata de arroz con canela y toque de vainilla.',
    price: 35.00,
    image: '/Logo.png',
    complementIds: [],
    isDailyWater: true,
    isAvailable: true,
    sizes: [
      { name: 'Litro', price: 35.00 },
      { name: 'Medio Litro', price: 25.00 }
    ]
  },
  {
    id: 'p6_3',
    categoryId: '3',
    name: 'Agua de Jamaica con Frutos Rojos',
    description: 'Infusión natural de flor de jamaica con zarzamora.',
    price: 35.00,
    image: '/Logo.png',
    complementIds: [],
    isDailyWater: true,
    isAvailable: false,
    sizes: [
      { name: 'Litro', price: 35.00 },
      { name: 'Medio Litro', price: 25.00 }
    ]
  },
  {
    id: 'p7',
    categoryId: '4',
    name: 'Brownie Caliente con Helado',
    description: 'Brownie de chocolate fudge con una bola de helado artesanal de vainilla.',
    price: 65.00,
    image: '/Logo.png',
    complementIds: ['c9']
  },
  {
    id: 'p8',
    categoryId: '4',
    name: 'Cheesecake de Frutos Rojos',
    description: 'Tarta de queso estilo Nueva York con jalea casera de frutos del bosque.',
    price: 70.00,
    image: '/Logo.png',
    complementIds: ['c9']
  }
];
