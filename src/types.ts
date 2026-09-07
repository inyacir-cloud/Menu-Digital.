export interface Extra {
  id: string;
  name: string;
  price: number;
}

/** Tamaño / presentación con su propio precio (ej. medio litro $20, litro $35) */
export interface SizeOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  /** Nombre tal como aparece en el menú */
  name: string;
  price: number;
  /** Texto corto bajo el nombre: ingredientes, tamaño, etc. */
  description?: string;
  /** Etiqueta destacada: "Más pedido", "Nuevo", "Recomendado"… */
  badge?: string;
  /** Agotado: se muestra en el menú pero no se puede pedir */
  unavailable?: boolean;
  /** Nombre que se muestra en el carrito / WhatsApp (opcional) */
  cartName?: string;
  /** Foto del producto (data URL, URL o "builtin:clave") */
  image?: string;
  /** Extras solo para este producto (se suman a los de su categoría) */
  extras?: Extra[];
  /** Tamaños disponibles con precio propio; el cliente elige al agregar */
  sizes?: SizeOption[];
  /** Ids de tamaños NO disponibles hoy (se apagan individualmente) */
  unavailableSizes?: string[];
}

export type CategoryLayout = "list" | "grid";

export interface MenuCategory {
  id: string;
  title: string;
  /** Subtítulo de la sección */
  description?: string;
  items: MenuItem[];
  /** data URL, URL o "builtin:clave" (fotos incluidas en la app) */
  image?: string;
  imageAlt?: string;
  /** Lado de la foto en escritorio */
  imageSide: "left" | "right";
  /** Fundir la foto con el papel (ideal para fondo blanco). Por defecto: true */
  blend?: boolean;
  /** "list" para platillos; "grid" compacto para complementos, bebidas… */
  layout?: CategoryLayout;
}

export type PaymentId = "efectivo" | "transferencia" | "mercadopago";

export interface PaymentMethod {
  id: PaymentId;
  label: string;
  enabled: boolean;
  /** Datos que ve el cliente al elegir este método (CLABE, alias, etc.) */
  details: string;
}

/** Colores editables del menú (hex #rrggbb) */
export interface Theme {
  /** Fondo del menú (papel) */
  background: string;
  /** Texto principal */
  text: string;
  /** Color principal: botones "+", etiquetas, manchas */
  primary: string;
  /** Color secundario: borde de las manchas decorativas */
  secondary: string;
}

export interface Settings {
  name: string;
  tagline: string;
  welcome: string;
  /** Número con lada internacional, solo dígitos (México: 52…) */
  whatsappNumber: string;
  /** Número tal como se muestra en el menú */
  whatsappDisplay: string;
  deliveryNote: string;
  /** Horario de atención (opcional) */
  hours: string;
  /** Dirección del local (opcional, con enlace a Google Maps) */
  address: string;
  /** Enlace o nombre de Facebook del negocio */
  facebook: string;
  payments: PaymentMethod[];
  /** Plantilla del mensaje de pedido, con marcadores {pedido}, {total}, … */
  messageTemplate: string;
  /** Marca plantillas ya migradas con {propina} y {confirmacion} */
  templateV2?: boolean;
  /** Mensaje con el que el cliente inicia la conversación desde el pie */
  contactMessage: string;
  theme: Theme;
  /** Negocio abierto / cerrado (controla la portada y el acceso al menú) */
  open: boolean;
  /** Aviso que se muestra en la portada cuando está cerrado */
  closedNote: string;
  /** Imagen del logo (data URL o URL); sin valor, se usa el sombrero por defecto */
  logo?: string;
}

export type CouponType = "percent" | "monto";

export interface Coupon {
  id: string;
  /** Código que escribe el cliente, en mayúsculas */
  code: string;
  /** "%": porcentaje del subtotal · "monto": cantidad fija en pesos */
  type: CouponType;
  value: number;
  enabled: boolean;
  /** Máximo de usos totales del cupón (0 = sin límite) */
  maxUses: number;
  /** Cuántas veces ya se usó */
  used: number;
  /** Fecha límite "YYYY-MM-DD" (opcional) */
  expiresAt?: string;
  /** Pedido mínimo para que aplique (opcional) */
  minOrder?: number;
}

/** Sección independiente de productos de temporada (no es una categoría) */
export interface SeasonalSection {
  /** Si está apagada o vacía, no aparece en el menú */
  enabled: boolean;
  title: string;
  /** Aviso visible en la sección. Ej. "Pregunta si hay" */
  note: string;
  items: MenuItem[];
}

/**
 * Bebidas del día: cada sabor se puede prender / apagar individualmente.
 * Solo se muestran los habilitados.
 */
export interface BebidasSection {
  enabled: boolean;
  title: string;
  note: string;
  items: MenuItem[];
}

export interface MenuData {
  categories: MenuCategory[];
  seasonal: SeasonalSection;
  bebidas: BebidasSection;
  coupons: Coupon[];
  settings: Settings;
}

export interface CartLine {
  /** Producto + extras + nota: dos líneas iguales se combinan */
  key: string;
  itemId: string;
  categoryId: string;
  categoryTitle: string;
  name: string;
  /** Precio base unitario (sin extras ni tamaño) */
  price: number;
  /** Tamaño elegido (para bebidas que ofrecen medio litro / litro) */
  size?: SizeOption;
  extras: Extra[];
  note: string;
  qty: number;
  addedAt: number;
}

export interface AddOptions {
  qty?: number;
  extras?: Extra[];
  note?: string;
  size?: SizeOption;
}

export type DeliveryMode = "envio" | "recoger";

export interface CustomerInfo {
  name: string;
  mode: DeliveryMode;
  address: string;
  notes: string;
  payment: PaymentId | "";
  cashAmount: string;
  /** Punto exacto marcado en el mapa (opcional) */
  location?: { lat: number; lng: number } | null;
}
