import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, PromotionalBatch, WholesaleTier } from './types';

const DEFAULT_TIERS: WholesaleTier[] = [
  { minQuantity: 10, maxQuantity: 29, unitPrice: 65.0 },
  { minQuantity: 30, maxQuantity: 59, unitPrice: 55.0 },
  { minQuantity: 60, maxQuantity: null, unitPrice: 48.0 },
];

const DEFAULT_BATCH: PromotionalBatch = {
  id: 'default',
  name: 'Lote Fornecedor 2024 - Frete Grátis',
  code: 'LOTE-6000',
  totalQuota: 6000,
  remainingQuota: 5842,
  minPiecesForFreeShip: 10,
  isActive: true,
  description: 'Frete Grátis automático a partir de 10 peças no atacado.',
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
  getFinalTotal: (isPix?: boolean) => number;
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
            retailPrice: product.retailPrice,
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
                retailPrice: product.retailPrice,
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
        return get().getTotalPieces() >= 10;
      },

      getCurrentTier: () => {
        const total = get().getTotalPieces();
        if (total < 10) return null;
        const tiers = get().tiers;
        if (total >= 60) return tiers.find((t) => t.minQuantity === 60) || null;
        if (total >= 30) return tiers.find((t) => t.minQuantity === 30) || null;
        return tiers.find((t) => t.minQuantity === 10) || null;
      },

      getItemUnitPrice: (item) => {
        const tier = get().getCurrentTier();
        if (tier) {
          return tier.unitPrice;
        }
        return item.retailPrice;
      },

      getSubtotal: () => {
        const items = get().items;
        const tier = get().getCurrentTier();
        return items.reduce((acc, item) => {
          const unit = tier ? tier.unitPrice : item.retailPrice;
          const customFee = item.customName ? 15.0 : 0.0;
          return acc + (unit + customFee) * item.quantity;
        }, 0);
      },

      getRetailReferenceTotal: () => {
        return get().items.reduce((acc, item) => {
          const customFee = item.customName ? 15.0 : 0.0;
          return acc + (item.retailPrice + customFee) * item.quantity;
        }, 0);
      },

      getSavings: () => {
        if (!get().isWholesale()) return 0;
        const reference = get().getRetailReferenceTotal();
        const current = get().getSubtotal();
        return Math.max(0, reference - current);
      },

      isFreeShippingEligible: () => {
        const total = get().getTotalPieces();
        const batch = get().promotionalBatch;
        return (
          total >= batch.minPiecesForFreeShip &&
          batch.isActive &&
          batch.remainingQuota >= total
        );
      },

      getShippingFee: () => {
        const total = get().getTotalPieces();
        if (total === 0) return 0;
        if (get().isFreeShippingEligible()) return 0;
        return 22.9 + Math.max(0, total - 1) * 3.5;
      },

      getFinalTotal: (isPix = false) => {
        const subtotal = get().getSubtotal();
        const shipping = get().getShippingFee();
        if (isPix) {
          return subtotal * 0.95 + shipping;
        }
        return subtotal + shipping;
      },

      getPiecesUntilWholesale: () => {
        const total = get().getTotalPieces();
        return Math.max(0, 10 - total);
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
