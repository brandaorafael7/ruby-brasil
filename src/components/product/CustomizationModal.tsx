'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, getSizeSurcharge } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedSize: string;
  onConfirm: (customName: string, customNumber: string) => void;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  product,
  selectedSize,
  onConfirm,
}: Props) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setNumber('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const basePrice = product.retailPrice || 60.0;
  const surcharge = getSizeSurcharge(selectedSize);
  const totalItemPrice = basePrice + surcharge + 15.0;

  const handleClose = () => {
    setName('');
    setNumber('');
    onClose();
  };

  const hasContent = name.trim().length > 0 || number.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.toUpperCase().trim();
    const cleanNumber = number.trim();

    if (!cleanName && !cleanNumber) return;

    onConfirm(cleanName, cleanNumber);
    setName('');
    setNumber('');
    onClose();
  };

  const displayName = (name.trim() || 'SEU NOME').toUpperCase().slice(0, 12);
  const displayNumber = number.trim() || '10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-crisp)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-crisp)' }}
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold block">
              ATELIER DE PERSONALIZAÇÃO OFICIAL
            </span>
            <h3 className="text-base font-black tracking-tight mt-0.5 line-clamp-1">
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold tactile hover:opacity-80"
            style={{ borderColor: 'var(--border-crisp)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 items-center">
            {/* Simulação Vetorial das Costas da Camisa em Tempo Real */}
            <div
              className="rounded-xl p-4 flex flex-col items-center justify-center border aspect-[4/5]"
              style={{
                backgroundColor: 'var(--bg-studio)',
                borderColor: 'var(--border-crisp)',
              }}
            >
              <div className="w-40 h-44 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 220"
                  className="w-full h-full drop-shadow-md"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M62,22 L82,16 C92,24 108,24 118,16 L138,22 L178,56 L158,88 L140,75 L140,196 C140,200 136,204 132,204 L68,204 C64,204 60,200 60,196 L60,75 L42,88 L22,56 Z"
                    fill="#18181b"
                    stroke="#e11d48"
                    strokeWidth="2"
                  />
                  <path
                    d="M65,21 L32,56 M135,21 L168,56"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <path
                    d="M78,17 C92,31 108,31 122,17"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <text
                    x="100"
                    y="68"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="monospace"
                    fontWeight="900"
                    fontSize="13"
                    letterSpacing="1.5"
                  >
                    {displayName}
                  </text>
                  <text
                    x="100"
                    y="138"
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontFamily="sans-serif"
                    fontWeight="900"
                    fontSize="60"
                  >
                    {displayNumber}
                  </text>
                </svg>
              </div>
              <span
                className="mt-2 text-[10px] font-mono uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Simulação da Fonte Oficial • Tam. {selectedSize}
              </span>
            </div>

            {/* Controles de Nome e Número */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Nome nas Costas (máx. 12)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="Ex: VINI JR"
                  className="w-full h-10 px-3 rounded-lg border text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-600"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Número (1 a 99)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 7"
                  className="w-full h-10 px-3 rounded-lg border text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-600"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-crisp)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div
                className="p-3 rounded-lg border text-xs space-y-1"
                style={{
                  backgroundColor: 'var(--bg-studio)',
                  borderColor: 'var(--border-crisp)',
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Camisa ({selectedSize}):
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {formatCurrency(basePrice + surcharge)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Personalização Termoaplicada:
                  </span>
                  <span className="font-mono font-bold text-rose-600">+ R$ 15,00</span>
                </div>
                <div
                  className="flex justify-between pt-1 border-t font-bold"
                  style={{ borderColor: 'var(--border-crisp)' }}
                >
                  <span>Total da Peça:</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(totalItemPrice)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!hasContent}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 tactile"
              >
                <Check className="w-4 h-4" />
                <span>Adicionar Personalizada ({formatCurrency(totalItemPrice)})</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
