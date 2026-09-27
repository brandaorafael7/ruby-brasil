'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Truck,
  CreditCard,
  QrCode,
  MessageCircle,
  Copy,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatCurrency, buildWhatsAppOrderMessage } from '@/lib/utils';
import { CheckoutForm } from '@/lib/types';

export default function CheckoutPage() {
  const {
    items,
    getTotalPieces,
    isWholesale,
    getCurrentTier,
    getSubtotal,
    getSavings,
    isFreeShippingEligible,
    getShippingFee,
    getFinalTotal,
    clearCart,
    promotionalBatch,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const [form, setForm] = useState<CheckoutForm>({
    customerType: 'PF',
    document: '',
    customerName: '',
    email: '',
    phone: '',
    zipCode: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 402',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    paymentMethod: 'PIX',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalPieces = getTotalPieces();
  const wholesaleActive = isWholesale();
  const currentTier = getCurrentTier();
  const subtotal = getSubtotal();
  const savings = getSavings();
  const isFreeShip = isFreeShippingEligible();
  const shippingFee = getShippingFee();
  const finalTotal = getFinalTotal(form.paymentMethod === 'PIX');

  if (items.length === 0 && !completedOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-white">Seu carrinho está vazio</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Adicione itens ao carrinho antes de prosseguir para o checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
        >
          Voltar para o Catálogo
        </Link>
      </div>
    );
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136futatacado-chave-aleatoria-982135204000053039865802BR5920FUT ATACADO LTDA6009SAO PAULO62070503***6304E8A2');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompletedOrder(data);
        clearCart();

        if (form.paymentMethod === 'WHATSAPP_ASSISTED') {
          const message = buildWhatsAppOrderMessage({
            items,
            form,
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
        }
      } else {
        alert(data.error || 'Erro ao finalizar pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">Pedido Realizado com Sucesso!</h1>
        <p className="text-zinc-400 text-sm mt-2">
          Número do Pedido: <strong className="text-emerald-400 font-mono text-base">{completedOrder.orderNumber}</strong>
        </p>

        {completedOrder.isFreeShipping && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 max-w-md mx-auto my-4 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Frete Grátis garantido pelo Lote Promocional de Fábrica!
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left max-w-md mx-auto my-6 space-y-3 text-xs">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Total Pago/Aprovado:</span>
            <span className="font-black text-emerald-400 text-sm">{formatCurrency(completedOrder.finalTotal)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Modalidade:</span>
            <span className="font-bold text-white">{completedOrder.isWholesale ? 'Atacado (10+ peças)' : 'Varejo'}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Forma de Pagamento:</span>
            <span className="font-bold text-white">
              {form.paymentMethod === 'PIX' ? 'Pix à Vista' : form.paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'WhatsApp'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">
            Enviamos o comprovante e os detalhes de separação para <strong>{form.email}</strong>.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar e continuar comprando
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente Seguro com Criptografia SSL</span>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                Dados de Identificação
              </h2>

              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customerType: 'PF' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    form.customerType === 'PF'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pessoa Física (Revendedor Autônomo)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customerType: 'PJ' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    form.customerType === 'PJ'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pessoa Jurídica (Lojista / CNPJ)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {form.customerType === 'PJ' ? 'Razão Social ou Nome Fantasia' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder={form.customerType === 'PJ' ? 'Ex: Silva Artigos Esportivos LTDA' : 'Ex: João da Silva'}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {form.customerType === 'PJ' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: e.target.value })}
                    placeholder={form.customerType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    WhatsApp / Telefone de Contato
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    E-mail para confirmação e rastreamento
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="joao@email.com"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                Endereço de Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">CEP</label>
                  <input
                    type="text"
                    required
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    placeholder="00000-000"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Ex: Av. Paulista"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="120"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={form.complement || ''}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Apto, Sala..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                Método de Pagamento
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  onClick={() => setForm({ ...form, paymentMethod: 'PIX' })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === 'PIX'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    PIX Instantâneo
                  </div>
                  <span className="inline-block mt-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    5% de Desconto à Vista
                  </span>
                </div>

                <div
                  onClick={() => setForm({ ...form, paymentMethod: 'CREDIT_CARD' })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === 'CREDIT_CARD'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    Cartão de Crédito
                  </div>
                  <span className="inline-block mt-1 text-[11px] text-zinc-400">
                    Até 12x no cartão
                  </span>
                </div>

                <div
                  onClick={() => setForm({ ...form, paymentMethod: 'WHATSAPP_ASSISTED' })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === 'WHATSAPP_ASSISTED'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    WhatsApp Consultor
                  </div>
                  <span className="inline-block mt-1 text-[11px] text-zinc-400">
                    Fechar direto com fábrica
                  </span>
                </div>
              </div>

              {form.paymentMethod === 'PIX' && (
                <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Chave Pix CNPJ (Copia e Cola):</span>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedPix ? 'Copiado!' : 'Copiar Chave'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] bg-zinc-900 p-2 rounded border border-zinc-800 text-zinc-300 truncate">
                    00020126580014br.gov.bcb.pix0136futatacado-chave-aleatoria-982135204000053039865802BR5920FUT ATACADO LTDA6009SAO PAULO62070503***6304E8A2
                  </p>
                </div>
              )}
            </div>

          </div>

          <div className="lg:col-span-5 space-y-4">
            
            <div className={`p-4 rounded-2xl border ${
              isFreeShip
                ? 'bg-gradient-to-br from-emerald-950/60 to-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Status do Frete & Fornecedor</h3>
              </div>

              {isFreeShip ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Frete 100% Grátis Garantido!
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Seu pedido atingiu {totalPieces} camisas e foi contemplado pelo lote promocional do fornecedor (Restam {promotionalBatch.remainingQuota} peças).
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-zinc-300">
                    Você está comprando <strong>{totalPieces} {totalPieces === 1 ? 'camisa' : 'camisas'}</strong> (Varejo).
                  </p>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">
                    Adicione mais {10 - totalPieces} camisas para liberar preço de atacado e Frete Grátis Nacional!
                  </p>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-black text-white">Resumo do Pedido ({totalPieces} itens)</h3>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs divide-y divide-zinc-800/80">
                {items.map((item) => (
                  <div key={item.cartItemId} className="pt-2 flex justify-between gap-2">
                    <div>
                      <p className="font-bold text-white line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        Tam: <strong className="text-zinc-200">{item.size}</strong> • Qtd: {item.quantity} un
                        {item.customName && ` • [${item.customName} #${item.customNumber || '10'}]`}
                      </p>
                    </div>
                    <span className="font-bold text-white shrink-0">
                      {formatCurrency(
                        (wholesaleActive ? (currentTier?.unitPrice || 65) : item.retailPrice) * item.quantity +
                        (item.customName ? 15 * item.quantity : 0)
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                    <span>Economia de Atacado:</span>
                    <span>- {formatCurrency(savings)}</span>
                  </div>
                )}

                {form.paymentMethod === 'PIX' && (
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Desconto Pix à Vista (5%):</span>
                    <span>- {formatCurrency(subtotal * 0.05)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-300">
                  <span>Frete</span>
                  {isFreeShip ? (
                    <span className="text-emerald-400 font-bold">GRÁTIS (Lote 6.000)</span>
                  ) : (
                    <span className="font-bold text-white">{formatCurrency(shippingFee)}</span>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total a Pagar</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                id="submit-order-button"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Processando Pedido...</span>
                ) : form.paymentMethod === 'WHATSAPP_ASSISTED' ? (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Enviar Pedido para o WhatsApp
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Confirmar e Finalizar Pedido
                  </>
                )}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
