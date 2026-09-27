import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CartItem, CheckoutForm, WholesaleTier } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function buildWhatsAppOrderMessage({
  items,
  form,
  totalPieces,
  isWholesale,
  currentTier,
  subtotal,
  savings,
  shippingFee,
  finalTotal,
  isFreeShipping,
}: {
  items: CartItem[];
  form: Partial<CheckoutForm>;
  totalPieces: number;
  isWholesale: boolean;
  currentTier: WholesaleTier | null;
  subtotal: number;
  savings: number;
  shippingFee: number;
  finalTotal: number;
  isFreeShipping: boolean;
}): string {
  const customerTypeLabel = form.customerType === 'PJ' ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)';
  const docLabel = form.customerType === 'PJ' ? 'CNPJ' : 'CPF';

  let text = `📦 *NOVO PEDIDO - RUBY BRASIL OFICIAL*\n\n`;
  text += `👤 *DADOS DO CLIENTE:*\n`;
  text += `• Nome/Razão Social: ${form.customerName || 'Não informado'}\n`;
  text += `• Tipo: ${customerTypeLabel}\n`;
  text += `• ${docLabel}: ${form.document || 'Não informado'}\n`;
  text += `• Telefone: ${form.phone || 'Não informado'}\n`;
  text += `• E-mail: ${form.email || 'Não informado'}\n\n`;

  text += `📍 *ENDEREÇO DE ENTREGA:*\n`;
  text += `• ${form.street || ''}, ${form.number || ''} ${form.complement ? `(${form.complement})` : ''}\n`;
  text += `• Bairro: ${form.neighborhood || ''} - ${form.city || ''}/${form.state || ''}\n`;
  text += `• CEP: ${form.zipCode || ''}\n\n`;

  text += `📊 *MODALIDADE & CONDIÇÃO COMERCIAL:*\n`;
  text += `• Categoria: ${isWholesale ? '🚀 ATACADO / REVENDA (10+ Peças)' : '🛒 VAREJO / AMOSTRA (< 10 Peças)'}\n`;
  text += `• Total de Peças: ${totalPieces} camisa(s)\n`;
  if (isWholesale && currentTier) {
    text += `• Faixa de Preço Aplicada: ${formatCurrency(currentTier.unitPrice)} / unidade\n`;
    text += `• Economia em relação ao Varejo: ${formatCurrency(savings)}\n`;
  }
  text += `• Frete: ${isFreeShipping ? '🎉 GRÁTIS (Lote Promocional de Fornecedor)' : formatCurrency(shippingFee)}\n\n`;

  text += `📋 *GRADE DETALHADA DE ITENS:*\n`;
  items.forEach((item, index) => {
    const customTxt = item.customName
      ? ` [Personalizada: ${item.customName} #${item.customNumber || 'S/N'}]`
      : '';
    text += `${index + 1}. *${item.name}*\n`;
    text += `   ↳ Tamanho: *${item.size}* | Qtd: *${item.quantity} un*${customTxt}\n`;
  });

  text += `\n💰 *VALOR TOTAL:*\n`;
  text += `• Subtotal Produtos: ${formatCurrency(subtotal)}\n`;
  text += `• Frete: ${isFreeShipping ? 'GRÁTIS' : formatCurrency(shippingFee)}\n`;
  text += `• *TOTAL FINAL DO PEDIDO: ${formatCurrency(finalTotal)}*\n`;
  text += `• Método Escolhido: ${
    form.paymentMethod === 'PIX'
      ? 'PIX (com 5% de desconto à vista)'
      : form.paymentMethod === 'CREDIT_CARD'
      ? 'Cartão de Crédito'
      : 'Atendimento Consultor WhatsApp'
  }\n\n`;

  text += `_Pedido gerado automaticamente pela plataforma Ruby Brasil._`;

  return text;
}
