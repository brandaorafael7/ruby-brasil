'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ArrowRight, Sparkles, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/lib/utils';

export default function FloatingCartBar() {
  const pathname = usePathname();
  const {
    getTotalPieces,
    getFinalTotal,
    openCart,
    isCartOpen,
    promotionalBatch,
    isFreeShippingEligible,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Não exibir no checkout, no admin ou quando o carrinho lateral já estiver aberto
  if (isCartOpen || pathname === '/checkout' || pathname?.startsWith('/admin')) {
    return null;
  }

  const totalPieces = getTotalPieces();
  if (totalPieces === 0) return null;

  const finalTotal = getFinalTotal();
  const isFreeShip = isFreeShippingEligible();
  const minPieces = promotionalBatch?.minPiecesForFreeShip || 10;

  return (
    <aside
      aria-label="Resumo do Carrinho"
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 ring-1 ring-emerald-500/20">
        
        {/* INFORMAÇÕES DO CARRINHO */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/50">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950">
              {totalPieces}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-black text-white truncate">
                {totalPieces} {totalPieces === 1 ? 'camisa' : 'camisas'}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400">
                {formatCurrency(finalTotal)}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-zinc-300 font-semibold truncate flex items-center gap-1">
              {isFreeShip ? (
                <>
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="text-emerald-300">Frete 100% Grátis ativo!</span>
                </>
              ) : (
                <span className="text-amber-300">
                  Faltam {minPieces - totalPieces} {minPieces - totalPieces === 1 ? 'peça' : 'peças'} para Frete Grátis
                </span>
              )}
            </p>
          </div>
        </div>

        {/* BOTÃO DE AÇÃO */}
        <button
          type="button"
          onClick={openCart}
          id="floating-cart-view-btn"
          className="px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/70 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span>Ver Carrinho</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </aside>
  );
}
