import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, PromotionalBatch, WholesaleTier, ShippingOption } from '@/types';
import { getSizeSurcharge } from '@/lib/utils';

const DEFAULT_TIERS: WholesaleTier[] = [
  { minQuantity: 1, maxQuantity: null, unitPrice: 60.0 },
];

const DEFAULT_BATCH: PromotionalBatch = {
  id: 'default',
  name: 'Condição Especial RubyBR',
  code: 'RUBY-FUT',
  totalQuota: 6000,
  remainingQuota: 5842,
  minPiecesForFreeShip: 10,
  fixedShippingFee: 30.0,
  isActive: true,
  description: 'Envio seguro para todo o Brasil via Melhor Envio (PAC, SEDEX e Loggi).',
};

export function getProductVariantStock(product: Product, size: string): number {
  const variant = product.variants?.find((v) => v.size === size);
  if (variant !== undefined) return Math.max(0, variant.stockQuantity);
  return product.variants && product.variants.length > 0 ? 0 : 50;
}

interface CartStore {
  items: CartItem[];
  tiers: WholesaleTier[];
  promotionalBatch: PromotionalBatch;
  isCartOpen: boolean;
  selectedMode: 'wholesale' | 'retail';
  selectedShippingOption: ShippingOption | null;
  shippingZipCode: string;

  setSelectedMode: (mode: 'wholesale' | 'retail') => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setPromotionalBatch: (batch: PromotionalBatch) => void;
  setSelectedShippingOption: (option: ShippingOption | null) => void;
  setShippingZipCode: (zipCode: string) => void;

  addItem: (
    product: Product,
    size: string,
    quantity: number,
    customName?: string,
    customNumber?: string
  ) => { success: boolean; added: number; message?: string };

  addGrid: (
    product: Product,
    grid: Record<string, number>
  ) => void;

  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getVariantStock: (productId: string, size: string, product?: Product) => number;
  getAvailableStockToAdd: (product: Product, size: string) => number;

  getTotalPieces: () => number;
  isWholesale: () => boolean;
  getCurrentTier: () => WholesaleTier | null;
  getItemUnitPrice: (item: CartItem) => number;
  getSubtotal: () => number;
  getRetailReferenceTotal: () => number;
  getSavings: () => number;
  isFreeShippingEligible: () => boolean;
  getShippingFee: () => number;
  getFinalTotal: () => number;
  getPiecesUntilWholesale: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tiers: DEFAULT_TIERS,
      promotionalBatch: DEFAULT_BATCH,
      isCartOpen: false,
      selectedMode: 'wholesale',
      selectedShippingOption: null,
      shippingZipCode: '',

      setSelectedMode: (mode) => set({ selectedMode: mode }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setPromotionalBatch: (batch) => set({ promotionalBatch: batch }),
      setSelectedShippingOption: (option) => set({ selectedShippingOption: option }),
      setShippingZipCode: (zipCode) => set({ shippingZipCode: zipCode }),

      addItem: (product, size, quantity, customName, customNumber) => {
        if (quantity <= 0) return { success: false, added: 0 };
        const normalizedCustomName = customName?.trim() || undefined;
        const normalizedCustomNumber = customNumber?.trim() || undefined;
        const cartItemId = `${product.id}-${size}-${normalizedCustomName || 'none'}-${normalizedCustomNumber || 'none'}`;

        const stock = getProductVariantStock(product, size);
        const currentItems = get().items;
        const currentInCartForSize = currentItems
          .filter((i) => i.productId === product.id && i.size === size)
          .reduce((acc, i) => acc + i.quantity, 0);

        const available = Math.max(0, stock - currentInCartForSize);
        if (available <= 0) {
          return {
            success: false,
            added: 0,
            message: `O tamanho ${size} já atingiu a quantidade máxima disponível no estoque (${stock} un).`,
          };
        }

        const toAdd = Math.min(quantity, available);

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += toAdd;
            updated[existingIndex].stockQuantity = stock;
            return { items: updated, isCartOpen: true };
          }

          const newItem: CartItem = {
            cartItemId,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            club: product.club,
            league: product.league,
            imageUrl: product.imageUrl,
            retailPrice: product.retailPrice || 60.0,
            size,
            quantity: toAdd,
            customName: normalizedCustomName,
            customNumber: normalizedCustomNumber,
            stockQuantity: stock,
          };

          return { items: [...state.items, newItem], isCartOpen: true };
        });

        return {
          success: true,
          added: toAdd,
          message:
            toAdd < quantity
              ? `Foram adicionadas apenas ${toAdd} unidade(s) devido ao limite do estoque (${stock} un).`
              : undefined,
        };
      },

      addGrid: (product, grid) => {
        set((state) => {
          const newItems = [...state.items];

          Object.entries(grid).forEach(([size, qty]) => {
            if (qty <= 0) return;
            const stock = getProductVariantStock(product, size);
            const currentInCartForSize = newItems
              .filter((i) => i.productId === product.id && i.size === size)
              .reduce((acc, i) => acc + i.quantity, 0);
            const available = Math.max(0, stock - currentInCartForSize);
            const toAdd = Math.min(qty, available);
            if (toAdd <= 0) return;

            const cartItemId = `${product.id}-${size}-none-none`;
            const existingIndex = newItems.findIndex((i) => i.cartItemId === cartItemId);

            if (existingIndex > -1) {
              newItems[existingIndex] = {
                ...newItems[existingIndex],
                quantity: newItems[existingIndex].quantity + toAdd,
                stockQuantity: stock,
              };
            } else {
              newItems.push({
                cartItemId,
                productId: product.id,
                name: product.name,
                slug: product.slug,
                club: product.club,
                league: product.league,
                imageUrl: product.imageUrl,
                retailPrice: product.retailPrice || 60.0,
                size,
                quantity: toAdd,
                stockQuantity: stock,
              });
            }
          });

          return { items: newItems, isCartOpen: true };
        });
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.cartItemId !== cartItemId) };
          }
          const targetItem = state.items.find((i) => i.cartItemId === cartItemId);
          if (!targetItem) return state;

          const maxStock = targetItem.stockQuantity ?? 999;
          const otherInCartForSize = state.items
            .filter((i) => i.cartItemId !== cartItemId && i.productId === targetItem.productId && i.size === targetItem.size)
            .reduce((sum, i) => sum + i.quantity, 0);

          const maxAllowedForThisItem = Math.max(0, maxStock - otherInCartForSize);
          const finalQty = Math.min(quantity, maxAllowedForThisItem);

          if (finalQty <= 0) {
            return { items: state.items.filter((i) => i.cartItemId !== cartItemId) };
          }

          return {
            items: state.items.map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity: finalQty } : i
            ),
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => set({ items: [], selectedShippingOption: null }),

      getVariantStock: (productId, size, product) => {
        if (product) {
          return getProductVariantStock(product, size);
        }
        const existingItem = get().items.find((i) => i.productId === productId && i.size === size);
        return existingItem?.stockQuantity ?? 999;
      },

      getAvailableStockToAdd: (product, size) => {
        const stock = getProductVariantStock(product, size);
        const inCart = get().items
          .filter((i) => i.productId === product.id && i.size === size)
          .reduce((sum, i) => sum + i.quantity, 0);
        return Math.max(0, stock - inCart);
      },

      getTotalPieces: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      isWholesale: () => {
        return false;
      },

      getCurrentTier: () => {
        const tiers = get().tiers;
        return tiers[0] || { minQuantity: 1, maxQuantity: null, unitPrice: 60.0 };
      },

      getItemUnitPrice: (item) => {
        const base = item.retailPrice || 60.0;
        return base + getSizeSurcharge(item.size);
      },

      getSubtotal: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          const base = item.retailPrice || 60.0;
          const surcharge = getSizeSurcharge(item.size);
          const customFee = item.customName ? 15.0 : 0.0;
          return acc + (base + surcharge + customFee) * item.quantity;
        }, 0);
      },

      getRetailReferenceTotal: () => {
        return get().items.reduce((acc, item) => {
          const customFee = item.customName ? 15.0 : 0.0;
          const refPrice = Math.max(60.0, item.retailPrice || 60.0);
          const surcharge = getSizeSurcharge(item.size);
          return acc + (refPrice + surcharge + customFee) * item.quantity;
        }, 0);
      },

      getSavings: () => {
        return 0;
      },

      isFreeShippingEligible: () => {
        return false; // Frete grátis removido: frete calculado via Melhor Envio
      },

      getShippingFee: () => {
        return get().selectedShippingOption?.price ?? 0;
      },

      getFinalTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().getShippingFee();
        return subtotal + shipping;
      },

      getPiecesUntilWholesale: () => {
        return 0;
      },
    }),
    {
      name: 'ruby-brasil-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        selectedMode: state.selectedMode,
        selectedShippingOption: state.selectedShippingOption,
        shippingZipCode: state.shippingZipCode,
      }),
    }
  )
);
