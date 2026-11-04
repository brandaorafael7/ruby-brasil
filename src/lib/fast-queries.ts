import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Busca todos os produtos com variantes e priceTiers em UMA ÚNICA
 * viagem de rede (1 round-trip SQL) ao Supabase (us-east-2), evitando os
 * 3 round-trips sequenciais do `include` do Prisma.
 */
export async function getFastCatalogProducts(includeInactive = false) {
  if (includeInactive) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        p."id",
        p."name",
        p."slug",
        p."description",
        p."league",
        p."club",
        p."season",
        p."type",
        p."imageUrl",
        p."gallery",
        p."retailPrice",
        p."isActive",
        p."allowCustom",
        p."customPrice",
        p."createdAt",
        p."updatedAt",
        COALESCE(v_agg.variants, '[]'::json) AS "variants",
        COALESCE(t_agg."priceTiers", '[]'::json) AS "priceTiers"
      FROM "public"."Product" p
      LEFT JOIN LATERAL (
        SELECT json_agg(v) AS variants
        FROM "public"."ProductVariant" v
        WHERE v."productId" = p."id"
      ) v_agg ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(t) AS "priceTiers"
        FROM "public"."WholesaleTier" t
        WHERE t."productId" = p."id"
      ) t_agg ON true
      ORDER BY p."createdAt" DESC
    `;
    return rows;
  }

  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      p."id",
      p."name",
      p."slug",
      p."description",
      p."league",
      p."club",
      p."season",
      p."type",
      p."imageUrl",
      p."gallery",
      p."retailPrice",
      p."isActive",
      p."allowCustom",
      p."customPrice",
      p."createdAt",
      p."updatedAt",
      COALESCE(v_agg.variants, '[]'::json) AS "variants",
      COALESCE(t_agg."priceTiers", '[]'::json) AS "priceTiers"
    FROM "public"."Product" p
    LEFT JOIN LATERAL (
      SELECT json_agg(v) AS variants
      FROM "public"."ProductVariant" v
      WHERE v."productId" = p."id"
    ) v_agg ON true
    LEFT JOIN LATERAL (
      SELECT json_agg(t) AS "priceTiers"
      FROM "public"."WholesaleTier" t
      WHERE t."productId" = p."id"
    ) t_agg ON true
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
  `;
  return rows;
}

/**
 * Versão em cache (Data Cache do Next.js) para a vitrine de clientes.
 * Revalida automaticamente a cada 120s ou imediatamente quando o Admin
 * cria/edita/exclui qualquer produto (`revalidateTag('catalog-products')`).
 */
export const getCachedCatalogProducts = unstable_cache(
  async () => getFastCatalogProducts(false),
  ['catalog-products-v1'],
  {
    revalidate: 120,
    tags: ['catalog-products'],
  }
);

/**
 * Busca todos os dados do Painel Admin (Lote, Tiers, Produtos com variantes e
 * últimos 100 Pedidos com itens) em UMA ÚNICA viagem de rede (1 round-trip SQL)
 * e 1 única conexão TCP/TLS ao Supabase.
 */
export async function getFastAdminDashboardData() {
  const result = await prisma.$queryRaw<
    Array<{
      batch: any;
      tiers: any[];
      products: any[];
      orders: any[];
    }>
  >`
    SELECT
      (
        SELECT row_to_json(b)
        FROM (
          SELECT *
          FROM "public"."PromotionalBatch"
          WHERE "isActive" = true
          ORDER BY "createdAt" DESC
          LIMIT 1
        ) b
      ) AS "batch",
      COALESCE(
        (
          SELECT json_agg(t ORDER BY t."minQuantity" ASC)
          FROM "public"."WholesaleTier" t
        ),
        '[]'::json
      ) AS "tiers",
      COALESCE(
        (
          SELECT json_agg(p_row)
          FROM (
            SELECT
              p."id",
              p."name",
              p."slug",
              p."description",
              p."league",
              p."club",
              p."season",
              p."type",
              p."imageUrl",
              p."gallery",
              p."retailPrice",
              p."isActive",
              p."allowCustom",
              p."customPrice",
              p."createdAt",
              p."updatedAt",
              COALESCE(v_agg.variants, '[]'::json) AS "variants"
            FROM "public"."Product" p
            LEFT JOIN LATERAL (
              SELECT json_agg(v) AS variants
              FROM "public"."ProductVariant" v
              WHERE v."productId" = p."id"
            ) v_agg ON true
            ORDER BY p."createdAt" DESC
          ) p_row
        ),
        '[]'::json
      ) AS "products",
      COALESCE(
        (
          SELECT json_agg(o_row)
          FROM (
            SELECT
              o.*,
              COALESCE(oi_agg.items, '[]'::json) AS "items"
            FROM "public"."Order" o
            LEFT JOIN LATERAL (
              SELECT json_agg(
                json_build_object(
                  'id', oi."id",
                  'orderId', oi."orderId",
                  'productId', oi."productId",
                  'size', oi."size",
                  'quantity', oi."quantity",
                  'unitPriceApplied', oi."unitPriceApplied",
                  'customName', oi."customName",
                  'customNumber', oi."customNumber",
                  'customFee', oi."customFee",
                  'totalItemPrice', oi."totalItemPrice",
                  'createdAt', oi."createdAt",
                  'product', (
                    SELECT row_to_json(pr)
                    FROM (
                      SELECT "id", "name", "club", "season", "league", "type", "gallery"
                      FROM "public"."Product"
                      WHERE "id" = oi."productId"
                    ) pr
                  )
                )
              ) AS items
              FROM "public"."OrderItem" oi
              WHERE oi."orderId" = o."id"
            ) oi_agg ON true
            ORDER BY o."createdAt" DESC
            LIMIT 100
          ) o_row
        ),
        '[]'::json
      ) AS "orders"
  `;

  return (
    result[0] || {
      batch: null,
      tiers: [],
      products: [],
      orders: [],
    }
  );
}
