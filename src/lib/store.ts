import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, PromotionalBatch, WholesaleTier } from './types';
import { getSizeSurcharge } from './utils';

const DEFAULT_TIERS: WholesaleTier[] = [
  { minQuantity: 1, maxQuantity: 49, unitPrice: 60.0 },
  { minQuantity: 50, maxQuantity: null, unitPrice: 55.0 },
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
  description: 'Frete Fixo e Frete Grátis a partir da cota mínima.',
};

interface CartStore {
  items: CartItem[];
  tiers: WholesaleTier[];
  promotionalBatch: PromotionalBatch;
  isCartOpen: boolean;
  selectedMode: 'wholesale' | 'retail';

  setSelectedMode: (mode: 'wholesale' | 'retail') => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setPromotionalBatch: (batch: PromotionalBatch) => void;

  addItem: (
    product: Product,
    size: string,
    quantity: number,
    customName?: string,
    customNumber?: string
  ) => void;

  addGrid: (
    product: Product,
    grid: Record<string, number>
  ) => void;

  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;

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

      setSelectedMode: (mode) => set({ selectedMode: mode }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setPromotionalBatch: (batch) => set({ promotionalBatch: batch }),

      addItem: (product, size, quantity, customName, customNumber) => {
        if (quantity <= 0) return;
        const normalizedCustomName = customName?.trim() || undefined;
        const normalizedCustomNumber = customNumber?.trim() || undefined;
        const cartItemId = `${product.id}-${size}-${normalizedCustomName || 'none'}-${normalizedCustomNumber || 'none'}`;

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
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
            quantity,
            customName: normalizedCustomName,
            customNumber: normalizedCustomNumber,
          };

          return { items: [...state.items, newItem], isCartOpen: true };
        });
      },

      addGrid: (product, grid) => {
        set((state) => {
          const newItems = [...state.items];

          Object.entries(grid).forEach(([size, qty]) => {
            if (qty <= 0) return;
            const cartItemId = `${product.id}-${size}-none-none`;
            const existingIndex = newItems.findIndex((i) => i.cartItemId === cartItemId);

            if (existingIndex > -1) {
              newItems[existingIndex] = {
                ...newItems[existingIndex],
                quantity: newItems[existingIndex].quantity + qty,
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
                quantity: qty,
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
          return {
            items: state.items.map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity } : i
            ),
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPieces: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      isWholesale: () => {
        return get().getTotalPieces() >= 50;
      },

      getCurrentTier: () => {
        const total = get().getTotalPieces();
        const tiers = get().tiers;
        if (total >= 50) return tiers.find((t) => t.minQuantity === 50) || { minQuantity: 50, maxQuantity: null, unitPrice: 55.0 };
        return tiers.find((t) => t.minQuantity === 1) || { minQuantity: 1, maxQuantity: 49, unitPrice: 60.0 };
      },

      getItemUnitPrice: (item) => {
        const total = get().getTotalPieces();
        const base = total >= 50 ? 55.0 : (item.retailPrice || 60.0);
        return base + getSizeSurcharge(item.size);
      },

      getSubtotal: () => {
        const items = get().items;
        const total = get().getTotalPieces();
        return items.reduce((acc, item) => {
          const base = total >= 50 ? 55.0 : (item.retailPrice || 60.0);
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
        const total = get().getTotalPieces();
        if (total < 50) return 0;
        return total * 5.0; // Desconto de R$ 5,00 por camisa ao comprar 50+ (R$ 60 - R$ 55)
      },

      isFreeShippingEligible: () => {
        const minPieces = get().promotionalBatch?.minPiecesForFreeShip ?? 10;
        return get().getTotalPieces() >= minPieces;
      },

      getShippingFee: () => {
        const total = get().getTotalPieces();
        if (total === 0) return 0;
        const minPieces = get().promotionalBatch?.minPiecesForFreeShip ?? 10;
        const fixedFee = get().promotionalBatch?.fixedShippingFee ?? 30.0;
        return total >= minPieces ? 0.0 : fixedFee;
      },

      getFinalTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().getShippingFee();
        return subtotal + shipping;
      },

      getPiecesUntilWholesale: () => {
        const total = get().getTotalPieces();
        return Math.max(0, 50 - total);
      },
    }),
    {
      name: 'ruby-brasil-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        selectedMode: state.selectedMode,
      }),
    }
  )
);
