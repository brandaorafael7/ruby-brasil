'use client';

import React, { useState } from 'react';
import { X, Shirt, Check } from 'lucide-react';
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

  // Limpa os campos quando o modal é aberto ou fechado
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Personalização Oficial</h3>
            <p className="text-xs text-zinc-400">Fonte e numeração idênticas às de jogo (+ R$ 15,00)</p>
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 my-4 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-white line-clamp-1">{product.name}</p>
            <p className="text-zinc-400">
              Tamanho: <strong className="text-amber-400">{selectedSize}</strong>
              {surcharge > 0 && (
                <span className="text-rose-400 font-bold ml-1.5">(+{formatCurrency(surcharge)})</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="font-black text-emerald-400 block">{formatCurrency(totalItemPrice)}</span>
            <span className="text-[10px] text-zinc-500">Camisa + Nome/Nº</span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-950 to-zinc-900 border border-zinc-800 rounded-xl p-4 text-center my-4 relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-2">
            Prévia das Costas
          </span>
          <div className="min-h-[70px] flex flex-col items-center justify-center">
            <span className="font-black text-2xl tracking-widest text-white drop-shadow-md">
              {name.toUpperCase() || 'SEU NOME'}
            </span>
            <span className="font-black text-4xl text-amber-400 drop-shadow-md mt-1">
              {number || '10'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Nome na Camisa (máx. 12 letras)
            </label>
            <input
              type="text"
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Ex: RONALDO ou SEU NOME"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Número (máx. 2 dígitos)
            </label>
            <input
              type="text"
              maxLength={2}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 9"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-xs hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasContent}
              className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50"
            >
              <Check className="w-4 h-4" />
              Aplicar e Comprar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
