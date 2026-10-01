import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CartItem, CheckoutForm, WholesaleTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const ADULT_SIZES = ['P', 'M', 'G', 'GG', 'XG', '3XL', '4XL'];
export const FEMALE_SIZES = ['P', 'M', 'G', 'GG', 'XG'];
export const KIDS_SIZES = ['16', '18', '20', '22', '24', '26', '28'];

export function getStandardSizesForProduct(
  productOrType?: { type?: string; league?: string; name?: string } | string | null
): string[] {
  if (!productOrType) return ADULT_SIZES;
  const typeStr = typeof productOrType === 'string' ? productOrType : productOrType.type || '';
  const leagueStr = typeof productOrType === 'string' ? '' : productOrType.league || '';
  const nameStr = typeof productOrType === 'string' ? '' : productOrType.name || '';

  const upperType = typeStr.toUpperCase().trim();
  const lowerAll = `${typeStr} ${leagueStr} ${nameStr}`.toLowerCase();

  if (upperType === 'INFANTIL' || lowerAll.includes('infantil') || lowerAll.includes('kids')) {
    return KIDS_SIZES;
  }
  if (upperType === 'FEMININA' || lowerAll.includes('feminin')) {
    return FEMALE_SIZES;
  }
  return ADULT_SIZES;
}

export function getSizeSurcharge(size: string): number {
  if (!size) return 0.0;
  const s = size.toUpperCase().trim();
  if (s === '3XL' || s === 'G3' || s === 'XXXL' || s === '2XG') return 6.0;
  if (s === '4XL' || s === 'G4' || s === 'XXXXL' || s === '3XG') return 12.0;
  return 0.0;
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
  text += `• WhatsApp: ${form.phone || 'Não informado'}\n`;
  text += `• E-mail: ${form.email || 'Não informado'}\n\n`;

  text += `📍 *ENDEREÇO DE ENTREGA:*\n`;
  text += `• ${form.street || ''}, ${form.number || ''} ${form.complement ? `(${form.complement})` : ''}\n`;
  text += `• Bairro: ${form.neighborhood || ''} - ${form.city || ''}/${form.state || ''}\n`;
  text += `• CEP: ${form.zipCode || ''}\n\n`;

  text += `📊 *CONDIÇÃO COMERCIAL:*\n`;
  text += `• Total de Peças: ${totalPieces} camisa(s)\n`;
  text += `• Preço Unitário: ${totalPieces >= 50 ? 'R$ 55,00 (Atacado 50+ peças)' : 'R$ 60,00 / unidade'}\n`;
  if (totalPieces >= 50) {
    text += `• Economia Atacado: ${formatCurrency(savings)}\n`;
  }
  text += `• Frete: ${isFreeShipping ? '🎉 FRETE GRÁTIS' : `${formatCurrency(shippingFee)} (Frete Fixo)`}\n\n`;

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
  text += `• *TOTAL DO PEDIDO: ${formatCurrency(finalTotal)}*\n`;
  text += `• Finalização: *Canal Oficial Ruby Brasil*\n\n`;

  text += `_Por favor, confirme a disponibilidade e envie a chave PIX para pagamento._`;

  return text;
}
