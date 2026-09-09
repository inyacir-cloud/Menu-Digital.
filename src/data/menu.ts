import type {
  BebidasSection,
  Combo,
  Coupon,
  Extra,
  MenuCategory,
  MenuData,
  SeasonalSection,
  Settings,
  Theme,
} from "../types";
import tacoImg from "../assets/taco.jpg";
import burritoImg from "../assets/burrito.jpg";
import sincronizadaImg from "../assets/sincronizada.jpg";
import gordasImg from "../assets/gordas.jpg";
import sopesImg from "../assets/sopes.jpg";
import quesadillasImg from "../assets/quesadillas.jpg";

/**
 * Fotos incluidas en la app. En los datos se guardan como "builtin:clave"
 * para no llenar el almacenamiento del navegador con la imagen completa.
 */
export const BUILTIN_IMAGES: Record<string, string> = {
  taco: tacoImg,
  burrito: burritoImg,
  sincronizada: sincronizadaImg,
  gordas: gordasImg,
  sopes: sopesImg,
  quesadillas: quesadillasImg,
};

export function resolveImage(src?: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("builtin:")) return BUILTIN_IMAGES[src.slice("builtin:".length)];
  return src;
}

/** Contraseña inicial del panel de administración (cámbiala desde el panel) */
export const DEFAULT_PASSWORD = "gordoflaca";

export const DEFAULT_THEME: Theme = {
  background: "#FFFFFF",
  text: "#161616",
  primary: "#FFDE59",
  secondary: "#FF751F",
};

export const DEFAULT_MESSAGE_TEMPLATE = [
  "🌮 *Nuevo pedido · {negocio}*",
  "",
  "{pedido}",
  "",
  "🎟️ *Cupón:* {cupon}",
  "💰 *Total: {total}*",
  "",
  "👤 *Nombre:* {nombre}",
  "🛵 *Entrega:* {entrega}",
  "📍 *Dirección:* {direccion}",
  "🗺️ *Ubicación:* {mapa}",
  "💳 *Pago:* {pago}",
  "📝 *Notas:* {notas}",
  "",
  "{propina}",
  "{confirmacion}",
  "",
  "¡Gracias por tu pedido! 🙌",
].join("\n");

export const DEFAULT_CONTACT_MESSAGE = "Hola, quiero hacer un pedido 🌮";

export const DEFAULT_SETTINGS: Settings = {
  name: "El Gordo & La Flaca",
  tagline: "Antojitos Mexicanos",
  welcome: "¡Bienvenidos y Buen Provecho!",
  whatsappNumber: "525635397099",
  whatsappDisplay: "56 3539 7099",
  deliveryNote: "Envíos solo Propina. Únicamente Whatsapp:",
  hours: "Viernes a martes · 11:30 am a 5:00 pm · Miércoles y jueves cerrado",
  address: "",
  facebook: "",
  payments: [
    { id: "efectivo", label: "Efectivo", enabled: true, details: "" },
    { id: "transferencia", label: "Transferencia", enabled: true, details: "" },
    { id: "mercadopago", label: "Mercado Pago", enabled: true, details: "" },
  ],
  messageTemplate: DEFAULT_MESSAGE_TEMPLATE,
  contactMessage: DEFAULT_CONTACT_MESSAGE,
  theme: DEFAULT_THEME,
  templateV2: true,
  open: true,
  closedNote: "Volvemos en un ratito. Mientras tanto, escríbenos por WhatsApp y con gusto te apartamos tu antojo. 🌮",
};

/** Extra propio: "Con Queso + $7" (antes aparecía como producto suelto) */
const conQueso = (id: string): Extra => ({ id, name: "Con Queso +", price: 7 });

export const DEFAULT_CATEGORIES: MenuCategory[] = [
  {
    id: "tacos",
    title: "Tacos",
    description: "Con papas a la francesa y salsa de la casa.",
    image: "builtin:taco",
    imageAlt: "Taco de arrachera con papas a la francesa y salsa verde",
    imageSide: "right",
    items: [
      { id: "taco-arrachera", name: "Arrachera", price: 40, extras: [conQueso("taco-arrachera-q")] },
      { id: "taco-chorizo", name: "Chorizo Argentino", price: 40, extras: [conQueso("taco-chorizo-q")] },
      { id: "taco-pechuga", name: "Pechuga", price: 40, extras: [conQueso("taco-pechuga-q")] },
      { id: "taco-bistec", name: "Bistec", price: 35, extras: [conQueso("taco-bistec-q")] },
      { id: "taco-longaniza", name: "Longaniza", price: 35, extras: [conQueso("taco-longaniza-q")] },
      {
        id: "taco-campechanos",
        name: "Campechanos",
        price: 40,
        description: "Bistec con longaniza",
        extras: [conQueso("taco-campechanos-q")],
      },
    ],
  },
  {
    id: "burritos",
    title: "Burritos",
    description: "Bien servidos, con papas a la francesa.",
    image: "builtin:burrito",
    imageAlt: "Burrito partido a la mitad con papas a la francesa",
    imageSide: "left",
    items: [
      { id: "burrito-arrachera", name: "Arrachera", price: 85 },
      { id: "burrito-chorizo", name: "Chorizo Argentino", price: 85 },
      { id: "burrito-pechuga", name: "Pechuga", price: 85 },
      { id: "burrito-bistec", name: "Bistec", price: 75 },
      { id: "burrito-longaniza", name: "Longaniza", price: 75 },
      { id: "burrito-campechanos", name: "Campechanos", price: 80, description: "Bistec con longaniza" },
      { id: "burrito-especial", name: "Especial", price: 90, badge: "Recomendado" },
    ],
  },
  {
    id: "sincronizadas",
    title: "Sincronizadas",
    description: "Doraditas, con queso derretido y papas a la francesa.",
    image: "builtin:sincronizada",
    imageAlt: "Sincronizada dorada con papas a la francesa",
    imageSide: "right",
    items: [
      { id: "sinc-sencilla", name: "Sencilla", price: 45 },
      { id: "sinc-bistec", name: "Con Bistec", price: 75 },
      { id: "sinc-longaniza", name: "Con Longaniza", price: 75 },
      { id: "sinc-campechana", name: "Campechana", price: 80, description: "Bistec con longaniza" },
      { id: "sinc-arrachera", name: "Con arrachera", price: 85 },
      { id: "sinc-chorizo", name: "Con chorizo Argentino", price: 85 },
      { id: "sinc-pechuga", name: "Con Pechuga", price: 85 },
    ],
  },
  {
    id: "gordas",
    title: "Gorditas",
    description: "De maíz, rellenas y bien doraditas.",
    image: "builtin:gordas",
    imageAlt: "Gordita rellena con crema, salsa y lechuga",
    imageSide: "left",
    items: [
      { id: "gorda-sencilla", name: "Sencilla", price: 30, extras: [conQueso("gorda-sencilla-q")] },
      { id: "gorda-bistec", name: "Con Bistec", price: 65, extras: [conQueso("gorda-bistec-q")] },
      { id: "gorda-longaniza", name: "Con Longaniza", price: 65, extras: [conQueso("gorda-longaniza-q")] },
      {
        id: "gorda-campechana",
        name: "Campechana",
        price: 70,
        description: "Bistec con longaniza",
        extras: [conQueso("gorda-campechana-q")],
      },
      { id: "gorda-arrachera", name: "Con Arrachera", price: 80, extras: [conQueso("gorda-arrachera-q")] },
      { id: "gorda-pechuga", name: "Con Pechuga", price: 80, extras: [conQueso("gorda-pechuga-q")] },
    ],
  },
  {
    id: "sopes",
    title: "Sopes",
    description: "Con frijol, lechuga, queso y salsa.",
    image: "builtin:sopes",
    imageAlt: "Sopes con lechuga, queso desmoronado y salsa",
    imageSide: "right",
    items: [
      { id: "sope-sencillo", name: "Sencillo", price: 30 },
      { id: "sope-queso-oaxaca", name: "Con Queso Oaxaca", price: 60 },
      { id: "sope-guisado", name: "Guisado (Quesadillas)", price: 65 },
      { id: "sope-bistec-longaniza", name: "Bistec o Longaniza", price: 65 },
      { id: "sope-bistec-longaniza-queso", name: "Bistec o Longaniza con queso", price: 70 },
      { id: "sope-campechano", name: "Campechano", price: 75 },
      { id: "sope-campechano-queso", name: "Campechano con queso", price: 80 },
    ],
  },
  {
    id: "quesadillas",
    title: "Quesadillas",
    description: "De harina, doraditas en el comal.",
    image: "builtin:quesadillas",
    imageAlt: "Quesadilla dorada rellena con salsa verde",
    imageSide: "left",
    items: [
      { id: "ques-pollo", name: "Pollo", price: 30, extras: [conQueso("ques-pollo-q")] },
      { id: "ques-carne", name: "Carne", price: 30, extras: [conQueso("ques-carne-q")] },
      { id: "ques-chicharron", name: "Chicharron", price: 30, extras: [conQueso("ques-chicharron-q")] },
      { id: "ques-picadillo", name: "Picadillo", price: 30, extras: [conQueso("ques-picadillo-q")] },
      { id: "ques-champinones", name: "Champiñones", price: 30, extras: [conQueso("ques-champinones-q")] },
      { id: "ques-queso", name: "Queso", price: 30, extras: [conQueso("ques-queso-q")] },
    ],
  },
];

/**
 * Productos de temporada: viven fuera de las categorías y se muestran
 * al final del menú. Por defecto está apagada; se activa desde el panel
 * (pestaña "Temporada").
 */
export const DEFAULT_SEASONAL: SeasonalSection = {
  enabled: false,
  title: "De temporada",
  note: "Pregunta si hay",
  items: [
    {
      id: "temp-birria",
      name: "Tacos de birria",
      price: 55,
      description: "Con consomé para remojar",
      badge: "Lo más pedido",
      extras: [{ id: "temp-birria-consome", name: "Consomé extra", price: 10 }],
    },
    {
      id: "temp-colorado",
      name: "Burrito de chile colorado",
      price: 90,
      description: "Receta de la abuela",
    },
    {
      id: "temp-tamarindo",
      name: "Agua de tamarindo",
      price: 25,
      description: "500 ml, bien fría",
    },
  ],
};

export const DEFAULT_BEBIDAS: BebidasSection = {
  enabled: false,
  title: "Bebidas del día",
  note: "Disponibilidad del día · pregunta si hay del sabor que quieres",
  items: [
    {
      id: "bdi-horchata",
      name: "Agua de horchata",
      price: 20,
      description: "Recién hecha",
      badge: "Clásica",
      sizes: [
        { id: "med", name: "Medio litro", price: 20 },
        { id: "litro", name: "Litro", price: 35 },
      ],
    },
    {
      id: "bdi-jamaica",
      name: "Agua de jamaica",
      price: 20,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 20 },
        { id: "litro", name: "Litro", price: 35 },
      ],
    },
    {
      id: "bdi-tamarindo",
      name: "Agua de tamarindo",
      price: 20,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 20 },
        { id: "litro", name: "Litro", price: 35 },
      ],
    },
    {
      id: "bdi-limon",
      name: "Limonada",
      price: 25,
      description: "Con azúcar al gusto",
      sizes: [
        { id: "med", name: "Medio litro", price: 25 },
        { id: "litro", name: "Litro", price: 40 },
      ],
    },
    {
      id: "bdi-pina",
      name: "Agua de piña",
      price: 25,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 25 },
        { id: "litro", name: "Litro", price: 40 },
      ],
    },
    {
      id: "bdi-sandia",
      name: "Agua de sandía",
      price: 25,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 25 },
        { id: "litro", name: "Litro", price: 40 },
      ],
    },
    {
      id: "bdi-melon",
      name: "Agua de melón",
      price: 25,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 25 },
        { id: "litro", name: "Litro", price: 40 },
      ],
    },
    {
      id: "bdi-naranja",
      name: "Agua de naranja",
      price: 25,
      description: "Recién hecha",
      sizes: [
        { id: "med", name: "Medio litro", price: 25 },
        { id: "litro", name: "Litro", price: 40 },
      ],
    },
    { id: "bdi-coca", name: "Coca-Cola 600 ml", price: 28 },
    { id: "bdi-sprite", name: "Sprite 600 ml", price: 28 },
    { id: "bdi-fanta", name: "Fanta 600 ml", price: 28 },
    { id: "bdi-boing-mango", name: "Boing Mango", price: 22, description: "500 ml" },
    { id: "bdi-boing-guayaba", name: "Boing Guayaba", price: 22, description: "500 ml" },
    { id: "bdi-agua-natural", name: "Agua natural", price: 15, description: "600 ml" },
  ],
};

export const DEFAULT_COMBOS: Combo[] = [];

/** Cupones de ejemplo, pausados: actívalos o crea los tuyos desde el panel */
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "cupon-bienvenida",
    code: "BIENVENIDA10",
    type: "percent",
    value: 10,
    enabled: false,
    visibility: "public",
    maxUses: 50,
    used: 0,
    minOrder: 150,
  },
  {
    id: "cupon-antojo",
    code: "ANTOJO30",
    type: "monto",
    value: 30,
    enabled: false,
    visibility: "public",
    maxUses: 0,
    used: 0,
  },
];

export const DEFAULT_MENU: MenuData = {
  categories: DEFAULT_CATEGORIES,
  seasonal: DEFAULT_SEASONAL,
  bebidas: DEFAULT_BEBIDAS,
  combos: DEFAULT_COMBOS,
  coupons: DEFAULT_COUPONS,
  settings: DEFAULT_SETTINGS,
};
