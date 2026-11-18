import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

let tableInitialized = false;

async function ensureAnalyticsTable() {
  if (tableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."SiteAnalyticsEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "eventType" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "path" TEXT,
        "productId" TEXT,
        "productName" TEXT,
        "category" TEXT,
        "device" TEXT DEFAULT 'Mobile',
        "referrer" TEXT DEFAULT 'Direto',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_createdAt_idx"
      ON "public"."SiteAnalyticsEvent"("createdAt" DESC);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_eventType_idx"
      ON "public"."SiteAnalyticsEvent"("eventType");
    `);
    tableInitialized = true;
  } catch (err) {
    console.error('Erro ao garantir tabela SiteAnalyticsEvent:', err);
  }
}

export async function POST(request: Request) {
  try {
    await ensureAnalyticsTable();

    const body = await request.json().catch(() => ({}));
    const eventType = String(body.eventType || 'PAGE_VIEW').slice(0, 40);
    const sessionId = String(body.sessionId || 'anon').slice(0, 80);
    const path = body.path ? String(body.path).slice(0, 180) : '/';
    const productId = body.productId ? String(body.productId).slice(0, 60) : null;
    const productName = body.productName ? String(body.productName).slice(0, 140) : null;
    const category = body.category ? String(body.category).slice(0, 80) : null;
    const device = body.device ? String(body.device).slice(0, 30) : 'Mobile';
    const referrer = body.referrer ? String(body.referrer).slice(0, 80) : 'Direto';

    // Ignora rotas do próprio painel admin para não inflar métricas de clientes
    if (path.startsWith('/admin')) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const id = `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO "public"."SiteAnalyticsEvent"
        ("id", "eventType", "sessionId", "path", "productId", "productName", "category", "device", "referrer", "createdAt")
      VALUES
        (${id}, ${eventType}, ${sessionId}, ${path}, ${productId}, ${productName}, ${category}, ${device}, ${referrer}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro em POST /api/analytics:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET(request: Request) {
  try {
    await ensureAnalyticsTable();

    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get('days') || '30');
    const days = [1, 7, 30, 90, 365].includes(daysParam) ? daysParam : 30;

    // 1. Totais de Eventos e Visitantes no Período
    const summaryRows = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) FILTER (WHERE "eventType" = 'PAGE_VIEW' OR "eventType" = 'PRODUCT_VIEW')::int AS "totalPageViews",
        COUNT(DISTINCT "sessionId")::int AS "uniqueVisitors",
        COUNT(DISTINCT "sessionId") FILTER (WHERE "createdAt" >= NOW() - INTERVAL '15 minutes')::int AS "onlineNow",
        COUNT(DISTINCT "sessionId") FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS "visitorsToday",
        COUNT(*) FILTER (WHERE "eventType" = 'PRODUCT_VIEW')::int AS "productViews",
        COUNT(*) FILTER (WHERE "eventType" = 'ADD_TO_CART')::int AS "addToCartCount",
        COUNT(*) FILTER (WHERE "eventType" = 'CHECKOUT_START' OR "eventType" = 'WHATSAPP_CLICK')::int AS "checkoutClicks",
        COUNT(*) FILTER (WHERE "eventType" = 'SEARCH')::int AS "searchCount"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
    `;

    // 2. Evolução Diária de Acessos (Últimos 14 dias)
    const dailyRows = await prisma.$queryRaw<any[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS "date",
        COUNT(*) FILTER (WHERE "eventType" = 'PAGE_VIEW' OR "eventType" = 'PRODUCT_VIEW')::int AS "views",
        COUNT(DISTINCT "sessionId")::int AS "visitors",
        COUNT(*) FILTER (WHERE "eventType" = 'ADD_TO_CART')::int AS "cartAdds"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // 3. Dispositivos (Mobile / Desktop / Tablet)
    const deviceRows = await prisma.$queryRaw<any[]>`
      SELECT
        COALESCE("device", 'Mobile') AS "device",
        COUNT(DISTINCT "sessionId")::int AS "count"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY "count" DESC
    `;

    // 4. Origens de Tráfego (Referrer)
    const referrerRows = await prisma.$queryRaw<any[]>`
      SELECT
        COALESCE("referrer", 'Direto') AS "referrer",
        COUNT(DISTINCT "sessionId")::int AS "count"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY "count" DESC
      LIMIT 6
    `;

    // 5. Produtos Mais Vistos / Adicionados na Sacola via Eventos
    const topEventProducts = await prisma.$queryRaw<any[]>`
      SELECT
        "productId",
        MAX("productName") AS "productName",
        COUNT(*) FILTER (WHERE "eventType" = 'PRODUCT_VIEW')::int AS "views",
        COUNT(*) FILTER (WHERE "eventType" = 'ADD_TO_CART')::int AS "cartAdds"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "productId" IS NOT NULL
        AND "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY "productId"
      ORDER BY "cartAdds" DESC, "views" DESC
      LIMIT 10
    `;

    // 6. Categorias & Termos Mais Buscados
    const topCategories = await prisma.$queryRaw<any[]>`
      SELECT
        "category",
        COUNT(*)::int AS "count"
      FROM "public"."SiteAnalyticsEvent"
      WHERE "category" IS NOT NULL
        AND "category" != ''
        AND "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY "category"
      ORDER BY "count" DESC
      LIMIT 8
    `;

    // 7. Últimos Eventos em Tempo Real
    const recentEvents = await prisma.$queryRaw<any[]>`
      SELECT
        "id",
        "eventType",
        "path",
        "productId",
        "productName",
        "category",
        "device",
        "referrer",
        "createdAt"
      FROM "public"."SiteAnalyticsEvent"
      ORDER BY "createdAt" DESC
      LIMIT 25
    `;

    return NextResponse.json({
      summary: summaryRows[0] || {
        totalPageViews: 0,
        uniqueVisitors: 0,
        onlineNow: 0,
        visitorsToday: 0,
        productViews: 0,
        addToCartCount: 0,
        checkoutClicks: 0,
        searchCount: 0,
      },
      daily: dailyRows || [],
      devices: deviceRows || [],
      referrers: referrerRows || [],
      topEventProducts: topEventProducts || [],
      topCategories: topCategories || [],
      recentEvents: recentEvents || [],
    });
  } catch (error) {
    console.error('Erro em GET /api/analytics:', error);
    return NextResponse.json(
      {
        summary: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          onlineNow: 0,
          visitorsToday: 0,
          productViews: 0,
          addToCartCount: 0,
          checkoutClicks: 0,
          searchCount: 0,
        },
        daily: [],
        devices: [],
        referrers: [],
        topEventProducts: [],
        topCategories: [],
        recentEvents: [],
      },
      { status: 200 }
    );
  }
}
