'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Settings, Truck, Flame } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default function Navbar() {
  const { getTotalPieces, getSubtotal, isWholesale, openCart, promotionalBatch } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPieces = mounted ? getTotalPieces() : 0;
  const subtotal = mounted ? getSubtotal() : 0;
  const wholesaleActive = mounted ? isWholesale() : false;
  const minPieces = promotionalBatch?.minPiecesForFreeShip ?? 10;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform">
            <span className="font-black text-xl text-white">💎</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                RUBY <span className="text-rose-400">BRASIL</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Camisas Tailandesas 1:1 Direto de Fábrica
            </p>
          </div>
        </Link>

        {/* DESTAQUES CENTRAIS (FRETE & ATACADO) */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-[11px]">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong className="text-emerald-400">Frete Grátis</strong> a partir de {minPieces} camisas</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>50+ camisas por <strong className="text-amber-300">R$ 55,00/un</strong></span>
          </div>
        </div>

        {/* AÇÕES (ADMIN & CARRINHO) */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold px-2.5 py-2 rounded-lg hover:bg-zinc-800/80 transition-colors"
            title="Painel Administrativo"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          <button
            onClick={openCart}
            id="cart-trigger-button"
            className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border ${
              wholesaleActive
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 ${wholesaleActive ? 'text-emerald-400' : 'text-zinc-300'}`} />
              {totalPieces > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {totalPieces}
                </span>
              )}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-400 leading-tight">
                {totalPieces === 0 ? 'Carrinho Vazio' : `${totalPieces} ${totalPieces === 1 ? 'peça' : 'peças'}`}
              </span>
              <span className="font-extrabold text-white text-xs sm:text-sm leading-tight">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
