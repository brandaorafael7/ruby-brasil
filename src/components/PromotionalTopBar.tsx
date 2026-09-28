'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Flame, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store';

export default function PromotionalTopBar() {
  const { promotionalBatch, setPromotionalBatch, getTotalPieces, isFreeShippingEligible } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const totalPieces = mounted ? getTotalPieces() : 0;
  const isEligible = mounted ? isFreeShippingEligible() : false;

  useEffect(() => {
    setMounted(true);
    async function syncBatch() {
      try {
        const res = await fetch('/api/batch');
        if (res.ok) {
          const data = await res.json();
          if (data && data.totalQuota) {
            setPromotionalBatch(data);
          }
        }
      } catch (e) {}
    }
    syncBatch();
    const interval = setInterval(syncBatch, 30000);
    return () => clearInterval(interval);
  }, [setPromotionalBatch]);

  return (
    <div className="bg-gradient-to-r from-rose-950 via-zinc-950 to-emerald-950 text-white border-b border-zinc-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 text-rose-400 font-bold tracking-wide uppercase">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            Condição Especial RubyBR:
          </div>
          <span className="text-zinc-200">
            Preço Base <strong>R$ 60,00</strong> • A partir de 50 camisas por <strong className="text-amber-300">R$ 55,00/un</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEligible ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              FRETE GRÁTIS ATIVADO NO SEU PEDIDO!
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>FRETE GRÁTIS</strong> a partir de <strong>10 camisas</strong> (Menos de 10: R$ 30 fixo)
              </span>
              {totalPieces > 0 && totalPieces < 10 && (
                <span className="text-amber-400 text-xs font-semibold ml-1">
                  (Faltam {10 - totalPieces})
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
