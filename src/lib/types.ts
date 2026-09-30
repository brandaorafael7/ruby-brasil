export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  stockQuantity: number;
}

export interface WholesaleTier {
  id?: string;
  productId?: string | null;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  league: string;
  club: string;
  season: string;
  type: string;
  imageUrl: string;
  gallery?: string | null;
  retailPrice: number;
  isActive: boolean;
  allowCustom: boolean;
  customPrice: number;
  variants: ProductVariant[];
  priceTiers?: WholesaleTier[];
}

export interface PromotionalBatch {
  id: string;
  name: string;
  code: string;
  totalQuota: number;
  remainingQuota: number;
  minPiecesForFreeShip: number;
  fixedShippingFee?: number;
  isActive: boolean;
  description?: string | null;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  slug: string;
  club: string;
  league: string;
  imageUrl: string;
  retailPrice: number;
  size: string;
  quantity: number;
  customName?: string;
  customNumber?: string;
}

export type CustomerType = 'PF' | 'PJ';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'WHATSAPP_ASSISTED';

export interface CheckoutForm {
  customerType: CustomerType;
  document: string;
  customerName: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: PaymentMethod;
}
