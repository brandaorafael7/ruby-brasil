import { ShippingOption } from '@/types';

interface CalculateShippingParams {
  toPostalCode: string;
  totalPieces: number;
  fromPostalCode?: string;
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
  postalCode: '13054040',
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
  let jadlogBase = 24.5;
  let jadlogDays = 5;

  switch (firstDigit) {
    case '0':
    case '1': // SP
      pacBase = 18.9;
      pacDays = 4;
      sedexBase = 24.9;
      sedexDays = 1;
      jadlogBase = 17.5;
      jadlogDays = 3;
      break;
    case '2': // RJ / ES
      pacBase = 23.9;
      pacDays = 5;
      sedexBase = 33.9;
      sedexDays = 2;
      jadlogBase = 21.9;
      jadlogDays = 4;
      break;
    case '3': // MG
      pacBase = 24.5;
      pacDays = 5;
      sedexBase = 34.5;
      sedexDays = 2;
      jadlogBase = 22.5;
      jadlogDays = 4;
      break;
    case '4': // BA / SE
      pacBase = 27.5;
      pacDays = 6;
      sedexBase = 41.9;
      sedexDays = 2;
      jadlogBase = 25.9;
      jadlogDays = 5;
      break;
    case '5':
    case '6': // Nordeste
      pacBase = 29.5;
      pacDays = 8;
      sedexBase = 46.5;
      sedexDays = 3;
      jadlogBase = 28.5;
      jadlogDays = 6;
      break;
    case '7': // Centro-Oeste / DF / TO / RO / AC
      pacBase = 28.5;
      pacDays = 7;
      sedexBase = 43.5;
      sedexDays = 2;
      jadlogBase = 27.5;
      jadlogDays = 5;
      break;
    case '8':
    case '9': // Sul (PR, SC, RS)
      pacBase = 25.5;
      pacDays = 6;
      sedexBase = 38.5;
      sedexDays = 2;
      jadlogBase = 23.9;
      jadlogDays = 4;
      break;
    default:
      pacBase = 28.0;
      pacDays = 7;
      sedexBase = 44.0;
      sedexDays = 3;
      jadlogBase = 26.0;
      jadlogDays = 5;
  }

  const pacPrice = Number((pacBase + extraWeightFee).toFixed(2));
  const sedexPrice = Number((sedexBase + extraWeightFee * 1.4).toFixed(2));
  const jadlogPrice = Number((jadlogBase + extraWeightFee * 0.95).toFixed(2));

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
      id: 'jadlog-package',
      name: '.Package',
      company: 'Jadlog',
      companyPicture: 'https://assets.melhorenvio.com.br/companies/jadlog.png',
      price: jadlogPrice,
      currency: 'R$',
      deliveryTime: jadlogDays,
      deliveryRange: { min: Math.max(1, jadlogDays - 1), max: jadlogDays },
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
 */
export async function calculateShippingRates({
  toPostalCode,
  totalPieces,
  fromPostalCode,
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
      '13054040' // CEP padrão de envio (Campinas - SP)
  );

  const isSandbox =
    process.env.MELHOR_ENVIO_SANDBOX === 'true' ||
    process.env.NODE_ENV === 'test';

  const baseUrl = isSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    : 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

  // Se não houver token configurado, retorna estimativa de contingência de forma transparente
  if (!token) {
    const fallbackOptions = getFallbackShippingRates(cleanToCep, totalPieces);
    return {
      success: true,
      options: fallbackOptions,
      fromPostalCode: originCep,
      toPostalCode: cleanToCep,
      isFallback: true,
      message: 'Cotação estimada (configure MELHOR_ENVIO_TOKEN para valores em tempo real).',
    };
  }

  // Especificações da embalagem com base no número de peças
  const qty = Math.max(1, totalPieces);
  const weight = Math.max(0.3, Number((qty * 0.25).toFixed(2))); // ~250g por camisa
  const height = Math.max(4, Math.min(100, Math.ceil(qty * 1.5)));
  const width = Math.max(15, Math.min(100, 20 + Math.floor(qty / 10)));
  const length = Math.max(20, Math.min(100, 25 + Math.floor(qty / 10)));

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
      const fallbackOptions = getFallbackShippingRates(cleanToCep, totalPieces);
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
      const fallbackOptions = getFallbackShippingRates(cleanToCep, totalPieces);
      return {
        success: true,
        options: fallbackOptions,
        fromPostalCode: originCep,
        toPostalCode: cleanToCep,
        isFallback: true,
      };
    }

    // Filtra opções válidas e sem erro
    const validOptions: ShippingOption[] = data
      .filter((item: any) => {
        if (!item || item.error) return false;
        const price = parseFloat(item.custom_price || item.price);
        return !isNaN(price) && price > 0;
      })
      .map((item: any) => {
        const price = parseFloat(item.custom_price || item.price);
        const deliveryTime =
          item.custom_delivery_time ||
          item.delivery_time ||
          item.custom_delivery_range?.max ||
          item.delivery_range?.max ||
          5;

        return {
          id: item.id,
          name: item.name || 'Padrão',
          company: item.company?.name || 'Transportadora',
          companyPicture: item.company?.picture,
          price: Number(price.toFixed(2)),
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
      const fallbackOptions = getFallbackShippingRates(cleanToCep, totalPieces);
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
    const fallbackOptions = getFallbackShippingRates(cleanToCep, totalPieces);
    return {
      success: true,
      options: fallbackOptions,
      fromPostalCode: originCep,
      toPostalCode: cleanToCep,
      isFallback: true,
    };
  }
}
