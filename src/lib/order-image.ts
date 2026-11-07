/**
 * Utilitário de Geração e Cópia de Imagens de Pedidos para o WhatsApp
 * Ruby Brasil - Football Archive & Atelier 1:1
 */

export interface OrderImageItem {
  name: string;
  club?: string;
  size: string;
  quantity: number;
  imageUrl?: string;
  customName?: string;
  customNumber?: string;
  isPreSale?: boolean;
  preSaleEta?: string | null;
  totalItemPrice?: number;
}

export interface OrderImageData {
  orderNumber: string;
  createdAt?: string | Date;
  customerName: string;
  customerCity?: string;
  customerState?: string;
  customerPhone?: string;
  totalQuantity: number;
  subtotal: number;
  shippingCost: number;
  shippingService?: string;
  finalTotal: number;
  items: OrderImageItem[];
}

/**
 * Carrega uma imagem com timeout e suporte seguro a CORS
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 4000);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        // Tenta carregar sem crossOrigin caso o servidor não suporte CORS
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = src;
      }
    };

    img.src = src;
  });
}

/**
 * Helper para desenhar retângulos arredondados
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Formata valores para BRL dentro do canvas
 */
function formatBRL(val: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  } catch {
    return `R$ ${(val || 0).toFixed(2).replace('.', ',')}`;
  }
}

/**
 * Gera um Canvas com o Card Visual em alta definição (2x Retina)
 */
export async function generateOrderCardCanvas(data: OrderImageData): Promise<HTMLCanvasElement> {
  const width = 820;
  const padding = 36;
  const contentWidth = width - padding * 2;

  // Alturas estimadas
  const headerHeight = 110;
  const customerBoxHeight = 64;
  const itemRowHeight = 96;
  const itemsGap = 12;
  const itemsSectionHeight = data.items.length * (itemRowHeight + itemsGap);
  const summaryHeight = 110;
  const footerHeight = 46;

  const totalHeight =
    padding +
    headerHeight +
    customerBoxHeight +
    16 +
    itemsSectionHeight +
    16 +
    summaryHeight +
    footerHeight +
    padding;

  const scale = 2; // 2x para Retina / visualização ultra nítida
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto 2D do Canvas.');

  ctx.scale(scale, scale);

  // 1. Fundo Geral (Pitch Dark / Zinc-950)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, totalHeight);

  // Borda externa sutil de 1px
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, totalHeight - 1);

  // Carrega logotipo oficial e fotos dos produtos em paralelo
  const logoPromise = loadImage('/ruby-brasil-icon.png');
  const itemsImagesPromises = data.items.map((item) => loadImage(item.imageUrl || ''));
  const [logoImg, ...itemImages] = await Promise.all([logoPromise, ...itemsImagesPromises]);

  let currentY = padding;

  // 2. CABEÇALHO COM LOGO E BADGE DO PEDIDO
  // Container do logo
  const logoBoxSize = 56;
  roundRect(ctx, padding, currentY, logoBoxSize, logoBoxSize, 14);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.stroke();

  if (logoImg) {
    ctx.save();
    roundRect(ctx, padding + 4, currentY + 4, logoBoxSize - 8, logoBoxSize - 8, 10);
    ctx.clip();
    ctx.drawImage(logoImg, padding + 4, currentY + 4, logoBoxSize - 8, logoBoxSize - 8);
    ctx.restore();
  }

  // Título e Subtítulo
  ctx.fillStyle = '#fafafa';
  ctx.font = '900 22px Inter, system-ui, sans-serif';
  ctx.fillText('RUBY BRASIL', padding + logoBoxSize + 16, currentY + 26);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '700 11px monospace';
  ctx.fillText('FOOTBALL ARCHIVE & ATELIER 1:1', padding + logoBoxSize + 16, currentY + 44);

  // Badge do Pedido no lado direito
  const badgeWidth = 230;
  const badgeHeight = 44;
  const badgeX = width - padding - badgeWidth;
  const badgeY = currentY + 6;

  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 12);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.stroke();

  ctx.fillStyle = '#e11d48'; // Rose-600
  ctx.font = '900 11px monospace';
  ctx.fillText('PEDIDO OFICIAL', badgeX + 16, badgeY + 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px monospace';
  ctx.fillText(`#${data.orderNumber}`, badgeX + 16, badgeY + 36);

  currentY += headerHeight;

  // 3. BARRA DE DADOS DO CLIENTE
  roundRect(ctx, padding, currentY, contentWidth, customerBoxHeight, 12);
  ctx.fillStyle = '#121215';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.stroke();

  // Cliente
  ctx.fillStyle = '#71717a';
  ctx.font = '600 10px monospace';
  ctx.fillText('CLIENTE', padding + 16, currentY + 24);

  ctx.fillStyle = '#fafafa';
  ctx.font = '700 14px Inter, system-ui, sans-serif';
  const customerNameStr =
    data.customerName.length > 32
      ? data.customerName.slice(0, 30) + '...'
      : data.customerName;
  ctx.fillText(customerNameStr, padding + 16, currentY + 46);

  // Local / Cidade
  const col2X = padding + 340;
  ctx.fillStyle = '#71717a';
  ctx.font = '600 10px monospace';
  ctx.fillText('ENTREGA', col2X, currentY + 24);

  ctx.fillStyle = '#d4d4d8';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  const cityStr = data.customerCity
    ? `${data.customerCity}${data.customerState ? `/${data.customerState}` : ''}`
    : 'Brasil';
  ctx.fillText(cityStr, col2X, currentY + 46);

  // Quantidade de Peças
  const col3X = width - padding - 130;
  ctx.fillStyle = '#71717a';
  ctx.font = '600 10px monospace';
  ctx.fillText('VOLUME', col3X, currentY + 24);

  ctx.fillStyle = '#e11d48';
  ctx.font = '800 14px monospace';
  ctx.fillText(`${data.totalQuantity} camisa(s)`, col3X, currentY + 46);

  currentY += customerBoxHeight + 16;

  // 4. LISTA VISUAL DAS CAMISAS ESCOLHIDAS (Com foto em destaque)
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const itemImg = itemImages[i];
    const rowY = currentY;

    // Card do Item
    roundRect(ctx, padding, rowY, contentWidth, itemRowHeight, 14);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Foto da Camisa (Thumbnail Proporcional)
    const imgW = 68;
    const imgH = 80;
    const imgX = padding + 8;
    const imgY = rowY + 8;

    roundRect(ctx, imgX, imgY, imgW, imgH, 10);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.stroke();

    if (itemImg) {
      ctx.save();
      roundRect(ctx, imgX, imgY, imgW, imgH, 10);
      ctx.clip();
      // Desenha com preenchimento cover centralizado
      const imgAspect = itemImg.width / itemImg.height;
      const targetAspect = imgW / imgH;
      let renderW = imgW;
      let renderH = imgH;
      let renderX = imgX;
      let renderY = imgY;

      if (imgAspect > targetAspect) {
        renderW = imgH * imgAspect;
        renderX = imgX - (renderW - imgW) / 2;
      } else {
        renderH = imgW / imgAspect;
        renderY = imgY - (renderH - imgH) / 2;
      }

      ctx.drawImage(itemImg, renderX, renderY, renderW, renderH);
      ctx.restore();
    } else {
      // Fallback sem foto
      ctx.fillStyle = '#71717a';
      ctx.font = '700 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SEM FOTO', imgX + imgW / 2, imgY + imgH / 2 + 4);
      ctx.textAlign = 'left';
    }

    // Informações da Peça
    const textStartX = imgX + imgW + 16;

    // Nome da Camisa
    ctx.fillStyle = '#fafafa';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    const truncatedName =
      item.name.length > 46 ? item.name.slice(0, 44) + '...' : item.name;
    ctx.fillText(`${i + 1}. ${truncatedName}`, textStartX, rowY + 28);

    // Badges de Tamanho e Quantidade
    let badgeCursorX = textStartX;
    const badgeSizeY = rowY + 38;

    // Badge Tamanho
    const sizeText = `Tam: ${item.size}`;
    const sizeBadgeW = ctx.measureText(sizeText).width + 16;
    roundRect(ctx, badgeCursorX, badgeSizeY, sizeBadgeW, 22, 6);
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px monospace';
    ctx.fillText(sizeText, badgeCursorX + 8, badgeSizeY + 15);
    badgeCursorX += sizeBadgeW + 8;

    // Badge Quantidade
    const qtyText = `Qtd: ${item.quantity}un`;
    const qtyBadgeW = ctx.measureText(qtyText).width + 16;
    roundRect(ctx, badgeCursorX, badgeSizeY, qtyBadgeW, 22, 6);
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px monospace';
    ctx.fillText(qtyText, badgeCursorX + 8, badgeSizeY + 15);
    badgeCursorX += qtyBadgeW + 8;

    // Badge Pré-Venda se aplicável
    if (item.isPreSale) {
      const preSaleText = item.preSaleEta ? `⏳ Pré-Venda: ${item.preSaleEta}` : '⏳ Pré-Venda';
      ctx.font = '700 10px Inter, system-ui, sans-serif';
      const psBadgeW = ctx.measureText(preSaleText).width + 16;
      roundRect(ctx, badgeCursorX, badgeSizeY, psBadgeW, 22, 6);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.stroke();
      ctx.fillStyle = '#fcd34d';
      ctx.fillText(preSaleText, badgeCursorX + 8, badgeSizeY + 15);
      badgeCursorX += psBadgeW + 8;
    }

    // Personalização (se houver)
    if (item.customName) {
      const customString = `★ Personalizada: ${item.customName} #${item.customNumber || 'S/N'}`;
      ctx.fillStyle = '#fbbf24'; // Amber-400
      ctx.font = '600 11px monospace';
      ctx.fillText(customString, textStartX, rowY + 76);
    } else {
      ctx.fillStyle = '#71717a';
      ctx.font = '500 11px Inter, system-ui, sans-serif';
      ctx.fillText('Manto Oficial Tailandês Padrão 1:1', textStartX, rowY + 76);
    }

    // Preço no lado direito do card
    if (item.totalItemPrice !== undefined) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#34d399'; // Emerald-400
      ctx.font = '800 14px monospace';
      ctx.fillText(formatBRL(item.totalItemPrice), width - padding - 16, rowY + 50);
      ctx.textAlign = 'left';
    }

    currentY += itemRowHeight + itemsGap;
  }

  currentY += 8;

  // 5. CAIXA DE RESUMO FINANCEIRO
  roundRect(ctx, padding, currentY, contentWidth, summaryHeight, 14);
  ctx.fillStyle = '#121215';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.stroke();

  // Linha 1: Subtotal e Frete
  const sumY = currentY + 30;
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText(`Subtotal: ${formatBRL(data.subtotal)}`, padding + 20, sumY);

  const shippingTxt = data.shippingService
    ? `Frete (${data.shippingService}): ${formatBRL(data.shippingCost)}`
    : `Frete (Melhor Envio): ${formatBRL(data.shippingCost)}`;
  ctx.fillText(shippingTxt, padding + 20, sumY + 22);

  // Linha 2: Grande Total no lado direito
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 11px monospace';
  ctx.fillText('VALOR TOTAL DO PEDIDO', width - padding - 20, sumY);

  ctx.fillStyle = '#34d399'; // Emerald-400
  ctx.font = '900 24px monospace';
  ctx.fillText(formatBRL(data.finalTotal), width - padding - 20, sumY + 30);
  ctx.textAlign = 'left';

  currentY += summaryHeight + 20;

  // 6. RODAPÉ DE AUTENTICIDADE
  ctx.fillStyle = '#71717a';
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.fillText('Ruby Brasil • Mantos Oficiais & Arquivo Histórico 1:1', padding, currentY + 14);

  ctx.textAlign = 'right';
  ctx.font = '700 11px monospace';
  ctx.fillStyle = '#a1a1aa';
  ctx.fillText('rubybr.com.br', width - padding, currentY + 14);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Converte o Canvas do Pedido em um Blob PNG
 */
export async function generateOrderCardBlob(data: OrderImageData): Promise<Blob> {
  const canvas = await generateOrderCardCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao exportar imagem do Canvas.'));
    }, 'image/png');
  });
}

/**
 * Copia a Imagem Visual do Pedido diretamente para a Área de Transferência
 * Permitindo colar diretamente no WhatsApp (Ctrl+V ou Colar no Celular)
 */
export async function copyOrderImageToClipboard(
  data: OrderImageData
): Promise<{ success: boolean; fallbackBlob?: Blob; error?: string }> {
  try {
    const blob = await generateOrderCardBlob(data);

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof ClipboardItem !== 'undefined'
    ) {
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
      return { success: true, fallbackBlob: blob };
    }

    return {
      success: false,
      fallbackBlob: blob,
      error: 'Área de transferência de imagem não suportada neste navegador.',
    };
  } catch (err: any) {
    console.error('Erro ao copiar imagem do pedido para a área de transferência:', err);
    try {
      const fallbackBlob = await generateOrderCardBlob(data);
      return { success: false, fallbackBlob, error: err?.message };
    } catch {
      return { success: false, error: err?.message };
    }
  }
}

/**
 * Faz download do arquivo PNG do pedido caso o navegador não suporte cópia direta
 */
export function downloadOrderImageFile(blob: Blob, filename = 'pedido-ruby-brasil.png') {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copia a foto individual de um produto específico para o Clipboard
 */
export async function copySingleProductImageToClipboard(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const img = await loadImage(imageUrl);
    if (!img) throw new Error('Não foi possível carregar a foto do produto.');

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Erro ao inicializar Canvas.');
    ctx.drawImage(img, 0, 0);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Erro ao converter imagem.'))), 'image/png');
    });

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof ClipboardItem !== 'undefined'
    ) {
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
      return { success: true };
    }

    return { success: false, error: 'Clipboard de imagem não suportado.' };
  } catch (err: any) {
    console.error('Erro ao copiar foto:', err);
    return { success: false, error: err?.message };
  }
}

