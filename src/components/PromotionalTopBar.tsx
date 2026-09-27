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

  const remaining = promotionalBatch?.remainingQuota ?? 5842;
  const total = promotionalBatch?.totalQuota ?? 6000;
  const percentRemaining = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-zinc-950 to-emerald-950 text-white border-b border-emerald-500/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wide uppercase">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            Lote Promocional de Fábrica:
          </div>
          <span className="text-zinc-200">
            Restam <strong className="text-amber-300 font-extrabold text-sm">{remaining.toLocaleString('pt-BR')}</strong> de {total.toLocaleString('pt-BR')} camisas
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 w-64 bg-zinc-900/90 rounded-full px-2 py-1 border border-zinc-700/60">
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
            {percentRemaining.toFixed(0)}% disp.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEligible ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              FRETE GRÁTIS ATIVADO NO SEU CARRINHO!
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>FRETE GRÁTIS BRASIL</strong> a partir de <strong>10 peças</strong>
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
