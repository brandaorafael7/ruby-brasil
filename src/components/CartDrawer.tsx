'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  Flame,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatCurrency, buildWhatsAppOrderMessage } from '@/lib/utils';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalPieces,
    isWholesale,
    getCurrentTier,
    getItemUnitPrice,
    getSubtotal,
    getSavings,
    isFreeShippingEligible,
    getShippingFee,
    getFinalTotal,
    getPiecesUntilWholesale,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isCartOpen) return null;

  const totalPieces = getTotalPieces();
  const wholesaleActive = isWholesale();
  const currentTier = getCurrentTier();
  const subtotal = getSubtotal();
  const savings = getSavings();
  const isFreeShip = isFreeShippingEligible();
  const shippingFee = getShippingFee();
  const finalTotal = getFinalTotal();
  const piecesNeeded = getPiecesUntilWholesale();

  const percentToWholesale = Math.min(100, (totalPieces / 10) * 100);

  let nextTierMessage = '';
  if (wholesaleActive) {
    if (totalPieces < 30) {
      nextTierMessage = `Faltam ${30 - totalPieces} peças para a Faixa 2 (R$ 55,00/un)`;
    } else if (totalPieces < 60) {
      nextTierMessage = `Faltam ${60 - totalPieces} peças para a Faixa 3 (R$ 48,00/un)`;
    } else {
      nextTierMessage = `Você atingiu a cota máxima de desconto (R$ 48,00/un)!`;
    }
  }

  const handleWhatsAppQuickQuote = () => {
    const message = buildWhatsAppOrderMessage({
      items,
      form: {
        customerType: 'PF',
        customerName: 'Cliente Loja Online',
        phone: 'A confirmar',
      },
      totalPieces,
      isWholesale: wholesaleActive,
      currentTier,
      subtotal,
      savings,
      shippingFee,
      finalTotal,
      isFreeShipping: isFreeShip,
    });

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="cart-drawer-container" data-testid="cart-drawer" className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 text-white shadow-2xl flex flex-col">
          
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 id="cart-title" className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  Carrinho de Compras
                  <span id="cart-pieces-count" className="text-xs font-bold text-zinc-400">({totalPieces} peças)</span>
                </h2>
                <span id="cart-mode-badge" className={`text-[11px] font-semibold ${wholesaleActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {wholesaleActive ? '🔥 Condição de Atacado Ativa' : '🛒 Modalidade Varejo'}
                </span>
              </div>
            </div>

            <button
              onClick={closeCart}
              id="close-cart-btn"
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 bg-zinc-900 border-b border-zinc-800/80">
            {!wholesaleActive ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-300 font-medium">
                    Faltam <strong className="text-amber-300 font-bold">{piecesNeeded} peças</strong> para Atacado
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">
                    Preço de Fábrica + Frete Grátis
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentToWholesale}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  Liberará Frete Grátis pelo Lote de 6.000 camisas!
                </p>
              </div>
            ) : (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-black">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  PREÇO DE ATACADO & FRETE GRÁTIS ATIVADOS!
                </div>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  {nextTierMessage}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-3 text-zinc-600" />
                <p className="font-bold text-zinc-300">Seu carrinho está vazio</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Selecione os tamanhos na grade de atacado ou adicione unidades no varejo.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const appliedUnit = getItemUnitPrice(item);
                const hasCustom = !!item.customName;

                return (
                  <div
                    key={item.cartItemId}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex gap-3 relative group hover:border-zinc-700 transition-all"
                  >
                    <div className="relative w-16 h-16 rounded-lg bg-zinc-950 overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-zinc-500 hover:text-red-400 p-0.5"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 font-bold">
                          Tam: {item.size}
                        </span>
                        {hasCustom && (
                          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {item.customName} #{item.customNumber || '10'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-emerald-400">
                            {formatCurrency(appliedUnit)}/un
                          </span>
                          {wholesaleActive && (
                            <span className="text-[10px] text-zinc-500 line-through">
                              {formatCurrency(item.retailPrice)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="cart-decrement-btn w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="cart-qty-value w-5 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="cart-increment-btn w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800/90 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal ({totalPieces} peças)</span>
                  <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/30">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      Economia Atacado:
                    </span>
                    <span>- {formatCurrency(savings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-zinc-400" />
                    Frete
                  </span>
                  {isFreeShip ? (
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      GRÁTIS (Lote 6.000)
                    </span>
                  ) : (
                    <span className="text-zinc-200 font-semibold">{formatCurrency(shippingFee)}</span>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Estimado</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">
                      {formatCurrency(finalTotal)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      ou {formatCurrency(finalTotal * 0.95)} no Pix (5% OFF)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  id="checkout-direct-button"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-950/60"
                >
                  Fechar Pedido no Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleWhatsAppQuickQuote}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Fechar Pedido via WhatsApp
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Garantia de Qualidade Fábrica • Envio com Rastreio</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
