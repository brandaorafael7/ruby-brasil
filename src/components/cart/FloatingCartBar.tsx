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

  return (
    <aside
      aria-label="Resumo do Carrinho"
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="bg-[#111111] text-white border border-white/15 rounded-full p-2.5 sm:px-4 sm:py-2.5 shadow-2xl flex items-center justify-between gap-3">
        
        {/* INFORMAÇÕES DO CARRINHO */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
          <div className="relative w-9 h-9 rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-[#007d48] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalPieces}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {totalPieces} {totalPieces === 1 ? 'item na sacola' : 'itens na sacola'}
              </span>
              <span className="text-xs sm:text-sm font-black text-white tabular-nums">
                • {formatCurrency(finalTotal)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 truncate">
              Despacho rápido via Melhor Envio
            </p>
          </div>
        </div>

        {/* BOTÃO DE AÇÃO */}
        <button
          type="button"
          onClick={openCart}
          id="floating-cart-view-btn"
          className="px-4 py-2 sm:py-2.5 rounded-full bg-white hover:bg-zinc-200 text-[#111111] font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <span>Ver Sacola</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </aside>
  );
}
