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

export function formatCPFOrCNPJ(value: string, type: 'PF' | 'PJ' = 'PF'): string {
  const digits = value.replace(/\D/g, '');
  if (type === 'PJ') {
    const raw = digits.slice(0, 14);
    if (raw.length > 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
    if (raw.length > 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    if (raw.length > 5) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length > 2) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    return raw;
  }
  const raw = digits.slice(0, 11);
  if (raw.length > 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  if (raw.length > 6) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
  if (raw.length > 3) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
  return raw;
}

export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
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
  shippingService,
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
  shippingService?: string;
  finalTotal: number;
  isFreeShipping?: boolean;
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
  const shippingServiceText = shippingService ? ` (${shippingService})` : ' (Melhor Envio)';
  text += `• Frete${shippingServiceText}: ${formatCurrency(shippingFee)}\n\n`;

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
  text += `• Frete${shippingServiceText}: ${formatCurrency(shippingFee)}\n`;
  text += `• *TOTAL DO PEDIDO: ${formatCurrency(finalTotal)}*\n`;
  text += `• Finalização: *Canal Oficial Ruby Brasil*\n\n`;

  text += `_Por favor, confirme a disponibilidade e envie a chave PIX para pagamento._`;

  return text;
}
