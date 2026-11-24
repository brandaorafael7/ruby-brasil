'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Settings, Sun, Moon } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
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

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40">
      {/* 1. BARRA UTILITÁRIA SUPERIOR ESTILO NIKE.COM.BR (#F5F5F5) */}
      <div
        className="hidden sm:block border-b text-[11px] font-medium"
        style={{
          backgroundColor: 'var(--bg-studio)',
          borderColor: 'var(--border-crisp)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-9 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-tight">RUBY BRASIL OFICIAL</span>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Padrão Tailandês 1:1 • Envio Seguro de Campinas/SP via Melhor Envio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/#grades" className="hover:opacity-70 transition-opacity font-semibold">
              Grades Atacado (12 Peças)
            </Link>
            <span style={{ color: 'var(--border-crisp)' }}>|</span>
            <Link href="/#faq" className="hover:opacity-70 transition-opacity">
              Ajuda & Logística
            </Link>
            <span style={{ color: 'var(--border-crisp)' }}>|</span>
            <Link href="/admin" prefetch={false} className="hover:opacity-70 transition-opacity flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Painel Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR PRINCIPAL ESTILO NIKE.COM.BR (FUNDO BRANCO PURO + LINKS CENTRAIS) */}
      <div
        className="border-b backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 96%, transparent)',
          borderColor: 'var(--border-crisp)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          {/* Logo Esquerda */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none"
          >
            <img
              src="/ruby-brasil-icon.png"
              alt="Ruby Brasil"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="leading-none">
              <span
                className="font-black text-base sm:text-lg tracking-tighter block"
                style={{ color: 'var(--text-primary)' }}
              >
                RUBY BRASIL
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest block mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                FOOTBALL ARCHIVE
              </span>
            </div>
          </Link>

          {/* Menu Central Estilo Nike */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold">
            <Link
              href="/#catalogo"
              className="py-5 border-b-2 border-transparent hover:border-current transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Em Oferta
            </Link>
            <Link
              href="/#grades"
              className="py-5 border-b-2 border-transparent hover:border-current transition-colors flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <span>Grades (12 Peças)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5f5f5] dark:bg-zinc-800 text-[#007d48] dark:text-emerald-400">
                Atacado
              </span>
            </Link>
            <Link
              href="/#pre-venda"
              className="py-5 border-b-2 border-transparent hover:border-current transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Lançamentos & Pré-Venda
            </Link>
            <Link
              href="/#infantil"
              className="py-5 border-b-2 border-transparent hover:border-current transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Infantil (Kids)
            </Link>
            <Link
              href="/#faq"
              className="py-5 border-b-2 border-transparent hover:border-current transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Dúvidas
            </Link>
          </nav>

          {/* Ações à Direita: Botão Visível Modo Claro/Escuro, Admin (Mobile) e Sacola */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
              style={{
                borderColor: 'var(--border-crisp)',
                backgroundColor: 'var(--bg-studio)',
                color: 'var(--text-primary)',
              }}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>

            <Link
              href="/admin"
              prefetch={false}
              className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              title="Painel Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={openCart}
              id="cart-trigger-button"
              className="h-10 px-4 rounded-full bg-[#111111] hover:bg-[#333333] text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sacola</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/15 text-[11px] font-bold tabular-nums leading-none">
                {totalPieces}
              </span>
              {subtotal > 0 && (
                <span className="hidden md:inline text-[11px] font-semibold tabular-nums pl-1.5 border-l border-current/20">
                  {formatCurrency(subtotal)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
