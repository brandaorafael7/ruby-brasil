import { ShippingOption } from '@/types';
import { KIDS_SIZES } from '@/lib/utils';

export interface ShippingItemInput {
  productId?: string;
  name?: string | null;
  type?: string | null;
  league?: string | null;
  size?: string | null;
  quantity?: number;
}

export interface CalculateShippingParams {
  toPostalCode: string;
  totalPieces: number;
  items?: ShippingItemInput[];
  fromPostalCode?: string;
  orderValue?: number;
}

export interface ShippingCalculationResult {
  success: boolean;
  options: ShippingOption[];
  fromPostalCode: string;
  toPostalCode: string;
  isFallback: boolean;
  message?: string;
}

/**
 * Peso oficial configurado por camisa: 300g (0.30 kg) - interno, oculto para os clientes do site
 */
export const SHIRT_WEIGHT_KG = 0.30;

/**
 * Peso oficial configurado por Kit (ex: Kit Infantil camisa + calção): 600g (0.60 kg)
 * Exatamente o dobro do peso das camisas (2x 300g), mantido oculto para os clientes do site.
 */
export const KIT_WEIGHT_KG = SHIRT_WEIGHT_KG * 2;

/**
 * Identifica se um item do carrinho/pedido é um Kit (ex: Kit Infantil camisa + calção)
 * que possui o dobro do peso de uma camisa avulsa.
 */
export function isKitItem(item?: ShippingItemInput | null): boolean {
  if (!item) return false;
  const upperType = (item.type || '').toUpperCase().trim();
  const lowerLeague = (item.league || '').toLowerCase();
  const lowerName = (item.name || '').toLowerCase();
  const cleanSize = (item.size || '').toUpperCase().trim();

  if (upperType === 'INFANTIL' || upperType === 'KIT') return true;
  if (lowerLeague.includes('infantil') || lowerLeague.includes('kit')) return true;
  if (
    lowerName.includes('infantil') ||
    lowerName.includes('kids') ||
    lowerName.includes('conjunto') ||
    /\bkit\b/i.test(lowerName)
  ) {
    return true;
  }
  if (KIDS_SIZES.includes(cleanSize)) return true;

  return false;
}

/**
 * Retorna o peso unitário oficial (em kg) de um item:
 * - Camisa: 0.30 kg (300g)
 * - Kit: 0.60 kg (600g - dobro do peso da camisa)
 */
export function getItemShippingWeightKg(item?: ShippingItemInput | null): number {
  return isKitItem(item) ? KIT_WEIGHT_KG : SHIRT_WEIGHT_KG;
}

/**
 * Calcula o peso total da encomenda e as unidades equivalentes de peso
 * (onde 1 camisa = 1 unidade de 300g e 1 kit = 2 unidades = 600g).
 */
export function calculatePackageWeightMetrics(
  items?: ShippingItemInput[],
  fallbackTotalPieces: number = 1
): {
  totalPieces: number;
  equivalentUnits: number;
  totalWeightKg: number;
} {
  if (Array.isArray(items) && items.length > 0) {
    let totalPieces = 0;
    let equivalentUnits = 0;
    let totalWeightKg = 0;

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const isKit = isKitItem(item);
      totalPieces += qty;
      equivalentUnits += qty * (isKit ? 2 : 1);
      totalWeightKg += qty * (isKit ? KIT_WEIGHT_KG : SHIRT_WEIGHT_KG);
    }

    return {
      totalPieces: Math.max(1, totalPieces),
      equivalentUnits: Math.max(1, equivalentUnits),
      totalWeightKg: Number(Math.max(SHIRT_WEIGHT_KG, totalWeightKg).toFixed(2)),
    };
  }

  const pieces = Math.max(1, Number(fallbackTotalPieces) || 1);
  return {
    totalPieces: pieces,
    equivalentUnits: pieces,
    totalWeightKg: Number((pieces * SHIRT_WEIGHT_KG).toFixed(2)),
  };
}

/**
 * Valor declarado fixo para seguro de carga no Melhor Envio: R$ 100,00 por peça
 */
export const SHIRT_INSURANCE_VALUE_PER_PIECE = 100.0;

/**
 * Margem de segurança e taxa de embalagem/manuseio (oculta do cliente, embutida no valor final do frete): R$ 5,00
 */
export const SHIPPING_HANDLING_FEE = 5.0;

/**
 * Remove pontuação de CEP, deixando apenas 8 dígitos.
 */
export function sanitizePostalCode(cep: string): string {
  return (cep || '').replace(/\D/g, '').slice(0, 8);
}

/**
 * Endereço oficial do remetente da loja (Campinas - SP)
 */
export const DEFAULT_SENDER_ADDRESS = {
  street: 'Rua Plácio Soave',
  number: '46',
  neighborhood: 'Chácara Santa Letícia',
  city: 'Campinas',
  state: 'SP',
  postalCode: '13054971',
};

/**
 * Fornece cotações de contingência (fallback) realistas caso a API do Melhor Envio
 * esteja sem token configurado ou indisponível temporariamente.
 * Garante que o cliente NUNCA seja impedido de fechar a compra.
 */
export function getFallbackShippingRates(
  toPostalCode: string,
  totalPieces: number
): ShippingOption[] {
  const cleanCep = sanitizePostalCode(toPostalCode);
  const firstDigit = cleanCep.charAt(0);
  const qty = Math.max(1, totalPieces);
  const extraWeightFee = Math.max(0, (qty - 1) * 1.25);

  let pacBase = 26.9;
  let pacDays = 7;
  let sedexBase = 39.9;
  let sedexDays = 2;
  let loggiBase = 21.5;
  let loggiDays = 4;

  switch (firstDigit) {
    case '0':
    case '1': // SP
      pacBase = 18.9;
      pacDays = 4;
      sedexBase = 24.9;
      sedexDays = 1;
      loggiBase = 15.5;
      loggiDays = 2;
      break;
    case '2': // RJ / ES
      pacBase = 23.9;
      pacDays = 5;
      sedexBase = 33.9;
      sedexDays = 2;
      loggiBase = 18.9;
      loggiDays = 3;
      break;
    case '3': // MG
      pacBase = 24.5;
      pacDays = 5;
      sedexBase = 34.5;
      sedexDays = 2;
      loggiBase = 19.5;
      loggiDays = 3;
      break;
    case '4': // BA / SE
      pacBase = 27.5;
      pacDays = 6;
      sedexBase = 41.9;
      sedexDays = 2;
      loggiBase = 24.9;
      loggiDays = 5;
      break;
    case '5':
    case '6': // Nordeste
      pacBase = 29.5;
      pacDays = 8;
      sedexBase = 46.5;
      sedexDays = 3;
      loggiBase = 26.5;
      loggiDays = 6;
      break;
    case '7': // Centro-Oeste / DF / TO / RO / AC
      pacBase = 28.5;
      pacDays = 7;
      sedexBase = 43.5;
      sedexDays = 2;
      loggiBase = 25.5;
      loggiDays = 5;
      break;
    case '8':
    case '9': // Sul (PR, SC, RS)
      pacBase = 25.5;
      pacDays = 6;
      sedexBase = 38.5;
      sedexDays = 2;
      loggiBase = 21.9;
      loggiDays = 4;
      break;
    default:
      pacBase = 28.0;
      pacDays = 7;
      sedexBase = 44.0;
      sedexDays = 3;
      loggiBase = 24.0;
      loggiDays = 5;
  }

  const pacPrice = Number((pacBase + extraWeightFee + SHIPPING_HANDLING_FEE).toFixed(2));
  const sedexPrice = Number((sedexBase + extraWeightFee * 1.4 + SHIPPING_HANDLING_FEE).toFixed(2));
  const loggiPrice = Number((loggiBase + extraWeightFee * 0.95 + SHIPPING_HANDLING_FEE).toFixed(2));

  return [
    {
      id: 'correios-pac',
      name: 'PAC',
      company: 'Correios',
      companyPicture: 'https://assets.melhorenvio.com.br/companies/correios.png',
      price: pacPrice,
      currency: 'R$',
      deliveryTime: pacDays,
      deliveryRange: { min: Math.max(1, pacDays - 1), max: pacDays },
    },
    {
      id: 'loggi-express',
      name: 'Loggi Express',
      company: 'Loggi',
      companyPicture: 'https://assets.melhorenvio.com.br/companies/loggi.png',
      price: loggiPrice,
      currency: 'R$',
      deliveryTime: loggiDays,
      deliveryRange: { min: Math.max(1, loggiDays - 1), max: loggiDays },
    },
    {
      id: 'correios-sedex',
      name: 'SEDEX Expresso',
      company: 'Correios',
      companyPicture: 'https://assets.melhorenvio.com.br/companies/correios.png',
      price: sedexPrice,
      currency: 'R$',
      deliveryTime: sedexDays,
      deliveryRange: { min: 1, max: sedexDays },
    },
  ];
}

/**
 * Calcula cotações de frete via API oficial do Melhor Envio (v2).
 * O peso (300g por camisa e 600g por kit) é calculado internamente no servidor
 * e mantido oculto para os clientes do site.
 */
export async function calculateShippingRates({
  toPostalCode,
  totalPieces,
  items,
  fromPostalCode,
  orderValue,
}: CalculateShippingParams): Promise<ShippingCalculationResult> {
  const cleanToCep = sanitizePostalCode(toPostalCode);
  if (cleanToCep.length !== 8) {
    return {
      success: false,
      options: [],
      fromPostalCode: '',
      toPostalCode: cleanToCep,
      isFallback: false,
      message: 'CEP de destino inválido. O CEP deve conter 8 dígitos.',
    };
  }

  const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
  const originCep = sanitizePostalCode(
    fromPostalCode ||
      process.env.MELHOR_ENVIO_POSTAL_CODE ||
      DEFAULT_SENDER_ADDRESS.postalCode ||
      '13054971' // CEP padrão de envio (Campinas - SP)
  );

  const isSandbox =
    process.env.MELHOR_ENVIO_SANDBOX === 'true' ||
    process.env.NODE_ENV === 'test';

  const baseUrl = isSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    : 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

  // Métricas internas de peso e volume (Camisa = 300g | Kit = 600g / 2x camisa)
  const metrics = calculatePackageWeightMetrics(items, totalPieces);
  const qty = metrics.totalPieces;
  const equivalentUnits = metrics.equivalentUnits;
  const weight = metrics.totalWeightKg;

  // Se não houver token configurado, retorna estimativa de contingência de forma transparente
  if (!token) {
    const fallbackOptions = getFallbackShippingRates(cleanToCep, equivalentUnits);
    return {
      success: true,
      options: fallbackOptions,
      fromPostalCode: originCep,
      toPostalCode: cleanToCep,
      isFallback: true,
      message: 'Cotação estimada (configure MELHOR_ENVIO_TOKEN para valores em tempo real).',
    };
  }

  // Especificações da embalagem com base na gramatura (300g por camisa / 600g por kit)
  const height = Math.max(4, Math.min(80, Math.ceil(equivalentUnits * 1.5)));
  const width = Math.max(16, Math.min(60, 20 + Math.floor(equivalentUnits / 5)));
  const length = Math.max(22, Math.min(60, 25 + Math.floor(equivalentUnits / 5)));

  // Valor declarado / Seguro de carga fixo configurado: R$ 100,00 por peça
  const declaredValue = Number((qty * SHIRT_INSURANCE_VALUE_PER_PIECE).toFixed(2));

  const payload = {
    from: { postal_code: originCep },
    to: { postal_code: cleanToCep },
    package: {
      height,
      width,
      length,
      weight,
    },
    options: {
      insurance_value: declaredValue,
      receipt: false,
      own_hand: false,
    },
  };

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'RubyBrasil/1.0 (contato@rubybr.com.br)',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      console.warn(`[Melhor Envio] Falha na requisição HTTP ${res.status}. Usando fallback.`);
      const fallbackOptions = getFallbackShippingRates(cleanToCep, equivalentUnits);
      return {
        success: true,
        options: fallbackOptions,
        fromPostalCode: originCep,
        toPostalCode: cleanToCep,
        isFallback: true,
        message: 'Cotação aproximada via Correios/Transportadoras.',
      };
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn('[Melhor Envio] Resposta inesperada (não é array):', data);
      const fallbackOptions = getFallbackShippingRates(cleanToCep, equivalentUnits);
      return {
        success: true,
        options: fallbackOptions,
        fromPostalCode: originCep,
        toPostalCode: cleanToCep,
        isFallback: true,
      };
    }

    // Filtra exclusivamente as opções permitidas: PAC, SEDEX e Loggi
    const validOptions: ShippingOption[] = data
      .filter((item: any) => {
        if (!item || item.error) return false;
        const price = parseFloat(item.custom_price || item.price);
        if (isNaN(price) || price <= 0) return false;

        const comp = (item.company?.name || '').toLowerCase();
        const name = (item.name || '').toLowerCase();

        // 1. Correios: PAC ou SEDEX
        const isCorreios =
          comp.includes('correios') && (name.includes('pac') || name.includes('sedex'));

        // 2. Loggi: Express ou Loggi Ponto (exclui taxas de coleta do remetente)
        const isLoggi = comp.includes('loggi') && !name.includes('coleta');

        return isCorreios || isLoggi;
      })
      .map((item: any) => {
        const rawPrice = parseFloat(item.custom_price || item.price);
        // Margem de embalagem/segurança embutida diretamente no valor final (oculta do cliente)
        const finalPrice = Number((rawPrice + SHIPPING_HANDLING_FEE).toFixed(2));
        const deliveryTime =
          item.custom_delivery_time ||
          item.delivery_time ||
          item.custom_delivery_range?.max ||
          item.delivery_range?.max ||
          5;

        let displayName = item.name || 'Padrão';
        if (item.company?.name === 'Loggi' && displayName.toLowerCase() === 'express') {
          displayName = 'Loggi Express';
        }

        return {
          id: item.id,
          name: displayName,
          company: item.company?.name || 'Transportadora',
          companyPicture: item.company?.picture,
          price: finalPrice,
          currency: item.currency || 'R$',
          deliveryTime,
          deliveryRange: item.delivery_range
            ? { min: item.delivery_range.min, max: item.delivery_range.max }
            : undefined,
        };
      })
      .sort((a, b) => a.price - b.price); // Ordena pelo mais barato primeiro

    if (validOptions.length === 0) {
      // Se não houver opções atendidas pelo Melhor Envio naquele CEP, entrega o fallback
      const fallbackOptions = getFallbackShippingRates(cleanToCep, equivalentUnits);
      return {
        success: true,
        options: fallbackOptions,
        fromPostalCode: originCep,
        toPostalCode: cleanToCep,
        isFallback: true,
      };
    }

    return {
      success: true,
      options: validOptions,
      fromPostalCode: originCep,
      toPostalCode: cleanToCep,
      isFallback: false,
    };
  } catch (error) {
    console.error('[Melhor Envio] Erro ao conectar:', error);
    const fallbackOptions = getFallbackShippingRates(cleanToCep, equivalentUnits);
    return {
      success: true,
      options: fallbackOptions,
      fromPostalCode: originCep,
      toPostalCode: cleanToCep,
      isFallback: true,
    };
  }
}
