'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Truck,
  MessageCircle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/store';
import { formatCurrency, buildWhatsAppOrderMessage, getSizeSurcharge } from '@/lib/utils';
import { CheckoutForm } from '@/types';

export default function CheckoutPage() {
  const {
    items,
    getTotalPieces,
    isWholesale,
    getCurrentTier,
    getItemUnitPrice,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutForm>({
    customerType: 'PF',
    document: '',
    customerName: '',
    email: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'WHATSAPP_ASSISTED',
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
  const finalTotal = getFinalTotal();

  const minPiecesForFreeShip = promotionalBatch?.minPiecesForFreeShip || 10;
  const fixedShippingFee = promotionalBatch?.fixedShippingFee || 30.0;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5579988542410';
  const whatsappDisplay = '(79) 98854-2410';

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
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
        >
          Voltar para o Catálogo
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: { ...form, paymentMethod: 'WHATSAPP_ASSISTED' },
          items,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompletedOrder(data);
        clearCart();

        // Enviar dados para o WhatsApp oficial (79) 98854-2410
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

        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else {
        setErrorMessage(data.error || 'Erro ao finalizar pedido.');
        alert(data.error || 'Erro ao finalizar pedido.');
      }
    } catch (err) {
      console.error(err);
      const msg = 'Ocorreu um erro ao comunicar com o servidor.';
      setErrorMessage(msg);
      alert(msg);
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

        <h1 className="text-2xl sm:text-3xl font-black text-white">Pedido Encaminhado com Sucesso!</h1>
        <p className="text-zinc-400 text-sm mt-2">
          Número do Pedido: <strong className="text-emerald-400 font-mono text-base">{completedOrder.orderNumber}</strong>
        </p>

        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 max-w-md mx-auto my-4 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Seu pedido foi aberto no WhatsApp para validação imediata e envio dos dados de pagamento.</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left max-w-md mx-auto my-6 space-y-3 text-xs">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Total do Pedido:</span>
            <span className="font-black text-emerald-400 text-sm">{formatCurrency(completedOrder.finalTotal)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Quantidade de Camisas:</span>
            <span className="font-bold text-white">{completedOrder.totalQuantity || totalPieces} peças</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Frete:</span>
            <span className="font-bold text-white">
              {completedOrder.isFreeShipping ? '🎉 GRÁTIS' : 'R$ 30,00 (Fixo)'}
            </span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Canal de Atendimento:</span>
            <span className="font-bold text-emerald-400">WhatsApp {whatsappDisplay}</span>
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">
            Caso a conversa do WhatsApp não tenha aberto automaticamente, você pode chamar diretamente pelo número <strong>{whatsappDisplay}</strong>.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Catálogo
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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-xs font-bold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            Continuar Comprando (Adicionar mais peças)
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente Seguro • Atendimento WhatsApp Oficial</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-sm flex items-start gap-3 shadow-xl animate-in fade-in">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <strong className="block font-black text-white text-sm mb-1">
                Aviso de Disponibilidade de Estoque:
              </strong>
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. DADOS DE IDENTIFICAÇÃO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                Seus Dados de Contato
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
                  Pessoa Física (CPF)
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
                  Pessoa Jurídica (CNPJ)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {form.customerType === 'PJ' ? 'Razão Social / Nome da Empresa' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder={form.customerType === 'PJ' ? 'Ex: Ruby Atacado LTDA' : 'Ex: João da Silva'}
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
                    WhatsApp de Contato
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. ENDEREÇO DE ENTREGA */}
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
                    placeholder="Ex: Av. Principal"
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={form.complement || ''}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Apto, Sala, Casa 2..."
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
                    placeholder="SE"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* 3. FINALIZAÇÃO VIA WHATSAPP (PIX E CARTÃO REMOVIDOS) */}
            <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-900">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                Atendimento e Pagamento
              </h2>

              <div className="p-4 rounded-xl bg-zinc-950/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Finalização Direta no WhatsApp</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      Oficial
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Número cadastrado: <strong className="text-emerald-400 font-bold">{whatsappDisplay}</strong>. Ao enviar o pedido, nosso consultor confirmará os modelos e fornecerá os dados para pagamento via Pix.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 space-y-4">
            
            {/* STATUS DO FRETE */}
            <div className={`p-4 rounded-2xl border ${
              isFreeShip
                ? 'bg-gradient-to-br from-emerald-950/60 to-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Regra de Frete</h3>
              </div>

              {isFreeShip ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Frete 100% Grátis Garantido!
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Seu pedido possui <strong>{totalPieces} camisas</strong> (a partir de {minPiecesForFreeShip} peças o frete é por nossa conta).
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-zinc-300">
                    Pedido atual: <strong>{totalPieces} {totalPieces === 1 ? 'camisa' : 'camisas'}</strong>.
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold mt-1">
                    Frete fixo de <strong>{formatCurrency(fixedShippingFee)}</strong>. Adicione mais <strong>{minPiecesForFreeShip - totalPieces}</strong> {minPiecesForFreeShip - totalPieces === 1 ? 'camisa' : 'camisas'} para liberar <strong>Frete Grátis</strong>!
                  </p>
                </div>
              )}

              {totalPieces >= 50 && (
                <div className="mt-2 pt-2 border-t border-emerald-500/30 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preço Atacado Especial: R$ 55,00 / unidade!
                </div>
              )}
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-black text-white">Resumo do Pedido ({totalPieces} peças)</h3>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs divide-y divide-zinc-800/80">
                {items.map((item) => {
                  const appliedUnit = getItemUnitPrice(item);
                  const customExtra = item.customName ? 15.0 : 0.0;
                  const surcharge = getSizeSurcharge(item.size);
                  return (
                    <div key={item.cartItemId} className="pt-2 flex justify-between gap-2">
                      <div>
                        <p className="font-bold text-white line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          Tam: <strong className="text-zinc-200">{item.size}</strong>{surcharge > 0 && <span className="text-amber-400 font-bold ml-1">(+{formatCurrency(surcharge)} Especial)</span>} • Qtd: {item.quantity} un
                          {item.customName && ` • [${item.customName} #${item.customNumber || '10'}]`}
                        </p>
                      </div>
                      <span className="font-bold text-white shrink-0">
                        {formatCurrency((appliedUnit + customExtra) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal ({totalPieces} peças)</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                    <span>Desconto Atacado 50+ peças:</span>
                    <span>- {formatCurrency(savings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-300">
                  <span>Frete</span>
                  {isFreeShip ? (
                    <span className="text-emerald-400 font-bold">GRÁTIS ({minPiecesForFreeShip}+ peças)</span>
                  ) : (
                    <span className="font-bold text-white">{formatCurrency(shippingFee)}</span>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total do Pedido</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                id="submit-order-button"
                disabled={isSubmitting}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                {isSubmitting ? (
                  <span>Gerando Pedido...</span>
                ) : (
                  <span>Enviar Pedido para o WhatsApp {whatsappDisplay}</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atendimento humanizado direto no WhatsApp oficial</span>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
