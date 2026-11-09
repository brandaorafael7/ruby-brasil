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

export interface EnglishSizeInfo {
  br: string;
  enCode: string;
  enName: string;
  bilingualCompact: string;
  bilingualFull: string;
}

export const SIZE_EN_MAP: Record<string, { enCode: string; enName: string }> = {
  P: { enCode: 'S', enName: 'Small' },
  M: { enCode: 'M', enName: 'Medium' },
  G: { enCode: 'L', enName: 'Large' },
  GG: { enCode: 'XL', enName: 'Extra Large' },
  XG: { enCode: '2XL', enName: 'Double XL (XXL)' },
  '2GG': { enCode: '2XL', enName: 'Double XL (XXL)' },
  EGG: { enCode: '2XL', enName: 'Double XL (XXL)' },
  '3XL': { enCode: '3XL', enName: 'Triple XL (XXXL)' },
  G3: { enCode: '3XL', enName: 'Triple XL (XXXL)' },
  '4XL': { enCode: '4XL', enName: 'Quadruple XL (XXXXL)' },
  G4: { enCode: '4XL', enName: 'Quadruple XL (XXXXL)' },
  '16': { enCode: 'Kids 16', enName: 'Youth 16 (3-4Y)' },
  '18': { enCode: 'Kids 18', enName: 'Youth 18 (4-5Y)' },
  '20': { enCode: 'Kids 20', enName: 'Youth 20 (5-6Y)' },
  '22': { enCode: 'Kids 22', enName: 'Youth 22 (7-8Y)' },
  '24': { enCode: 'Kids 24', enName: 'Youth 24 (9-10Y)' },
  '26': { enCode: 'Kids 26', enName: 'Youth 26 (11-12Y)' },
  '28': { enCode: 'Kids 28', enName: 'Youth 28 (13-14Y)' },
};

export const SIZE_LEGEND_EN_ITEMS = [
  { br: 'P', en: 'S', desc: 'Small' },
  { br: 'M', en: 'M', desc: 'Medium' },
  { br: 'G', en: 'L', desc: 'Large' },
  { br: 'GG', en: 'XL', desc: 'Extra Large' },
  { br: 'XG', en: '2XL / XXL', desc: 'Double XL' },
  { br: '3XL', en: '3XL / XXXL', desc: 'Triple XL' },
  { br: '4XL', en: '4XL / XXXXL', desc: 'Quadruple XL' },
  { br: '16–28', en: 'Kids 16–28', desc: 'Youth / Children Kit' },
];

export const MODEL_LEGEND_EN_ITEMS = [
  { pt: 'Torcedor', en: 'Fan Version', desc: 'Standard Stadium Fit' },
  { pt: 'Jogador', en: 'Player Version', desc: 'Authentic Slim Fit' },
  { pt: 'Feminina', en: "Women's Version", desc: 'Ladies Cut' },
  { pt: 'Infantil', en: 'Kids Kit (Youth)', desc: 'Jersey + Shorts Set' },
  { pt: 'Retrô', en: 'Retro Version', desc: 'Classic Vintage' },
];

export function getEnglishSizeInfo(size?: string | null): EnglishSizeInfo {
  const raw = (size || '').trim().toUpperCase();
  if (!raw) {
    return {
      br: '-',
      enCode: '-',
      enName: 'Standard',
      bilingualCompact: '-',
      bilingualFull: '-',
    };
  }
  const mapped = SIZE_EN_MAP[raw];
  if (!mapped) {
    return {
      br: raw,
      enCode: raw,
      enName: raw,
      bilingualCompact: raw,
      bilingualFull: raw,
    };
  }
  const bilingualCompact =
    raw === mapped.enCode ? `${raw}` : `${raw} (${mapped.enCode})`;
  const bilingualFull =
    raw === mapped.enCode
      ? `${raw} (${mapped.enName})`
      : `${raw} (EN: ${mapped.enCode} - ${mapped.enName})`;

  return {
    br: raw,
    enCode: mapped.enCode,
    enName: mapped.enName,
    bilingualCompact,
    bilingualFull,
  };
}

export function formatBilingualSize(size?: string | null): string {
  return getEnglishSizeInfo(size).bilingualCompact;
}

export function getModelTypeBilingual(
  productOrType?: { type?: string | null; league?: string | null; name?: string | null } | string | null
): { pt: string; en: string; bilingual: string } {
  if (!productOrType) {
    return {
      pt: 'Torcedor',
      en: 'Fan Version',
      bilingual: 'Torcedor (Fan Version)',
    };
  }
  const typeStr = typeof productOrType === 'string' ? productOrType : productOrType.type || '';
  const leagueStr = typeof productOrType === 'string' ? '' : productOrType.league || '';
  const nameStr = typeof productOrType === 'string' ? '' : productOrType.name || '';
  const upperType = typeStr.toUpperCase().trim();
  const lowerAll = `${typeStr} ${leagueStr} ${nameStr}`.toLowerCase();

  if (upperType === 'INFANTIL' || lowerAll.includes('infantil') || lowerAll.includes('kids')) {
    return {
      pt: 'Infantil',
      en: 'Kids Kit (Youth)',
      bilingual: 'Infantil (Kids Kit)',
    };
  }
  if (upperType === 'FEMININA' || lowerAll.includes('feminin')) {
    return {
      pt: 'Feminina',
      en: "Women's Version",
      bilingual: "Feminina (Women's Version)",
    };
  }
  if (upperType === 'JOGADOR' || lowerAll.includes('jogador') || lowerAll.includes('player')) {
    return {
      pt: 'Jogador',
      en: 'Player Version',
      bilingual: 'Jogador (Player Version)',
    };
  }
  if (upperType === 'RETRO' || upperType === 'RETRÔ' || lowerAll.includes('retrô') || lowerAll.includes('retro')) {
    return {
      pt: 'Retrô',
      en: 'Retro Version',
      bilingual: 'Retrô (Retro Version)',
    };
  }
  return {
    pt: 'Torcedor',
    en: 'Fan Version',
    bilingual: 'Torcedor (Fan Version)',
  };
}

export interface PreSaleMetadata {
  isPreSale: boolean;
  preSaleEta: string;
}

export function getProductPreSaleInfo(
  product?: {
    isPreSale?: boolean;
    preSaleEta?: string | null;
    gallery?: string | null;
    league?: string | null;
    type?: string | null;
    name?: string | null;
  } | null
): PreSaleMetadata {
  if (!product) {
    return { isPreSale: false, preSaleEta: '' };
  }

  if (typeof product.isPreSale === 'boolean') {
    return {
      isPreSale: product.isPreSale,
      preSaleEta: product.preSaleEta || '',
    };
  }

  if (product.gallery) {
    try {
      const parsed = JSON.parse(product.gallery);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (typeof parsed.isPreSale === 'boolean') {
          return {
            isPreSale: parsed.isPreSale,
            preSaleEta: typeof parsed.preSaleEta === 'string' ? parsed.preSaleEta : '',
          };
        }
      }
    } catch {
      // ignore invalid JSON in gallery
    }
  }

  const lowerLeague = (product.league || '').toLowerCase();
  const lowerType = (product.type || '').toLowerCase();
  const isFromText =
    lowerLeague.includes('pré-venda') ||
    lowerLeague.includes('pre-venda') ||
    lowerLeague.includes('prevenda') ||
    lowerType === 'pre_venda' ||
    lowerType === 'pré-venda';

  return {
    isPreSale: isFromText,
    preSaleEta: product.preSaleEta || '',
  };
}

/**
 * Retorna todas as fotos do produto (a foto principal `imageUrl` seguida das fotos
 * extras salvas em `gallery`), sem duplicatas.
 */
export function getProductGalleryImages(
  product?: {
    imageUrl?: string | null;
    gallery?: string | null;
  } | null
): string[] {
  if (!product) return [];

  const result: string[] = [];
  const addUnique = (url?: string | null) => {
    if (!url || typeof url !== 'string') return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!result.includes(trimmed)) {
      result.push(trimmed);
    }
  };

  addUnique(product.imageUrl);

  if (product.gallery) {
    try {
      const parsed = JSON.parse(product.gallery);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => addUnique(item));
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.images)) {
        parsed.images.forEach((item: any) => addUnique(item));
      }
    } catch {
      // ignore invalid JSON
    }
  }

  return result;
}

export function serializeProductPreSaleGallery(
  existingGallery: string | null | undefined,
  meta: { isPreSale: boolean; preSaleEta?: string | null; images?: string[] }
): string {
  let baseObj: Record<string, any> = {};
  if (existingGallery) {
    try {
      const parsed = JSON.parse(existingGallery);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        baseObj = { ...parsed };
      } else if (Array.isArray(parsed)) {
        baseObj = { images: parsed };
      }
    } catch {
      // ignore
    }
  }

  baseObj.isPreSale = Boolean(meta.isPreSale);
  baseObj.preSaleEta = meta.preSaleEta ? String(meta.preSaleEta).trim() : '';

  if (Array.isArray(meta.images)) {
    baseObj.images = meta.images.map((u) => String(u).trim()).filter(Boolean);
  }

  return JSON.stringify(baseObj);
}

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

export function toAbsoluteUrl(url?: string | null, origin?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://rubybr.com.br');
  return `${base.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
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
  origin,
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
  origin?: string;
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
    const preSaleTxt = item.isPreSale
      ? ` [⏳ PRÉ-VENDA${item.preSaleEta ? `: ${item.preSaleEta}` : ''}]`
      : '';
    const sizeInfo = getEnglishSizeInfo(item.size);
    const modelInfo = getModelTypeBilingual({ name: item.name, league: item.league });
    text += `${index + 1}. *${item.name}*${preSaleTxt}\n`;
    text += `   ↳ Modelo: *${modelInfo.bilingual}*\n`;
    text += `   ↳ Tamanho: *${sizeInfo.bilingualFull}* | Qtd: *${item.quantity} un*${customTxt}\n`;
    const photoUrl = toAbsoluteUrl(item.imageUrl, origin);
    if (photoUrl) {
      text += `   ↳ 📸 Foto: ${photoUrl}\n`;
    }
  });

  text += `\n🌐 *SIZE & MODEL LEGEND (ENGLISH / SUPPLIER):*\n`;
  text += `• Sizes: P = S (Small) | M = M (Medium) | G = L (Large) | GG = XL | XG = 2XL (XXL) | 3XL | 4XL\n`;
  text += `• Models: Torcedor = Fan Version | Jogador = Player Version | Feminina = Women's | Infantil = Kids Kit\n`;

  text += `\n💰 *VALOR TOTAL:*\n`;
  text += `• Subtotal Produtos: ${formatCurrency(subtotal)}\n`;
  text += `• Frete${shippingServiceText}: ${formatCurrency(shippingFee)}\n`;
  text += `• *TOTAL DO PEDIDO: ${formatCurrency(finalTotal)}*\n`;
  text += `• Finalização: *Canal Oficial Ruby Brasil*\n\n`;

  text += `_Por favor, confirme a disponibilidade e envie a chave PIX para pagamento._`;

  return text;
}
