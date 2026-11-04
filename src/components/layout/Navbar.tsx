'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Settings, Sun, Moon } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/lib/utils';

export default function Navbar() {
  const { getTotalPieces, getSubtotal, isWholesale, openCart, setPromotionalBatch } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Sincroniza preferência de tema (Boutique Claro por padrão, ou tema salvo)
    const savedTheme = localStorage.getItem('ruby-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }

    // Sincroniza lote promocional sem precisar de barra empilhada extra
    async function syncBatch() {
      try {
        const res = await fetch('/api/batch');
        if (res.ok) {
          const data = await res.json();
          if (data && data.totalQuota) {
            setPromotionalBatch(data);
          }
        }
      } catch {}
    }
    syncBatch();
    const interval = setInterval(syncBatch, 300000);
    return () => clearInterval(interval);
  }, [setPromotionalBatch]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ruby-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ruby-theme', 'light');
    }
  };

  const totalPieces = mounted ? getTotalPieces() : 0;
  const subtotal = mounted ? getSubtotal() : 0;
  const wholesaleActive = mounted ? isWholesale() : false;

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
        borderColor: 'var(--border-crisp)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 sm:h-16 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
        {/* Marca + Ícone Oficial Camisa-Diamante Ruby Brasil */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 rounded"
          >
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl border flex items-center justify-center p-1 overflow-hidden tactile group-hover:scale-105"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <img
                src="/ruby-brasil-icon.png"
                alt="Ícone Oficial Ruby Brasil"
                className="w-full h-full object-contain ruby-icon-adaptive"
              />
            </div>
            <div className="min-w-0">
              <span
                className="font-black text-sm sm:text-base tracking-tighter block leading-none whitespace-nowrap"
                style={{ color: 'var(--text-primary)' }}
              >
                RUBY BRASIL
              </span>
              <span
                className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider sm:tracking-widest block mt-0.5 whitespace-nowrap truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="sm:hidden">ATELIER TAILANDÊS 1:1</span>
                <span className="hidden sm:inline">FOOTBALL ARCHIVE & ATELIER 1:1</span>
              </span>
            </div>
          </Link>

          {/* Navegação Direta das Coleções */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            <Link
              href="/#catalogo"
              className="px-3 py-1.5 rounded-full tactile hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              Catálogo 25/26
            </Link>
            <Link
              href="/#pre-venda"
              className="px-3 py-1.5 rounded-full tactile flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Pré-Venda (Drops)</span>
            </Link>
            <Link
              href="/#infantil"
              className="px-3 py-1.5 rounded-full tactile hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Linha Kids
            </Link>
            <Link
              href="/#faq"
              className="px-3 py-1.5 rounded-full tactile hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Logística & FAQ
            </Link>
          </nav>
        </div>

        {/* Ações: Regra Atacado, Tema, Admin e Sacola */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Pílula Discreta Preço Direto de Fábrica & Envio */}
          <div
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
            style={{
              borderColor: 'var(--border-crisp)',
              backgroundColor: 'var(--bg-studio)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              Direto de Fábrica <strong style={{ color: 'var(--text-primary)' }}>R$ 60</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Melhor Envio
            </span>
          </div>

          {/* Alternador de Tema Editorial (Boutique Light vs Pitch Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title="Alternar entre Modo Claro (Boutique) e Modo Escuro"
            className="w-9 h-9 sm:w-auto sm:px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            style={{
              borderColor: 'var(--border-crisp)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="hidden sm:inline">Modo Escuro</span>
              </>
            )}
          </button>

          {/* Link Admin */}
          <Link
            href="/admin"
            prefetch={false}
            className="w-9 h-9 md:w-auto md:px-2.5 rounded-full border flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 tactile hover:opacity-80"
            style={{
              borderColor: 'var(--border-crisp)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
            title="Painel Administrativo"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Admin</span>
          </Link>

          {/* Botão da Sacola Interativa */}
          <button
            type="button"
            onClick={openCart}
            id="cart-trigger-button"
            className={`h-9 px-3 sm:px-4 rounded-full text-xs font-bold flex items-center gap-1.5 sm:gap-2 shrink-0 tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${
              wholesaleActive
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="uppercase tracking-wider text-[11px] sm:text-xs">Sacola</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] sm:text-[11px] tabular-nums leading-none">
              {totalPieces}
            </span>
            {subtotal > 0 && (
              <span className="hidden sm:inline font-mono text-[11px] tabular-nums opacity-90 pl-1 border-l border-current/20">
                {formatCurrency(subtotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
