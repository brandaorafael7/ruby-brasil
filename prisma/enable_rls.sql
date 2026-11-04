-- ============================================================================
-- RUBY BRASIL - SUPABASE SECURITY HARDENING (ROW-LEVEL SECURITY)
-- Resolve o alerta crítico: rls_disabled_in_public ("Table publicly accessible")
-- ============================================================================

-- 1. Ativar Row-Level Security (RLS) em todas as tabelas do schema public
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WholesaleTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PromotionalBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem" ENABLE ROW LEVEL SECURITY;

-- 2. Revogar permissões de escrita da Data API pública (anon / authenticated)
-- O back-end Next.js (Prisma) utiliza a role `postgres` (bypassrls) e não é afetado.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."Order" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."OrderItem" FROM anon, authenticated;

-- 3. Políticas explícitas de leitura (SELECT) apenas para o catálogo público
DROP POLICY IF EXISTS "public_read_active_products" ON "public"."Product";
CREATE POLICY "public_read_active_products"
  ON "public"."Product"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_product_variants" ON "public"."ProductVariant";
CREATE POLICY "public_read_product_variants"
  ON "public"."ProductVariant"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_wholesale_tiers" ON "public"."WholesaleTier";
CREATE POLICY "public_read_wholesale_tiers"
  ON "public"."WholesaleTier"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_active_batches" ON "public"."PromotionalBatch";
CREATE POLICY "public_read_active_batches"
  ON "public"."PromotionalBatch"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

-- 4. Políticas restritivas explícitas para bloquear qualquer acesso externo a pedidos
DROP POLICY IF EXISTS "deny_public_access_orders" ON "public"."Order";
CREATE POLICY "deny_public_access_orders"
  ON "public"."Order"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "deny_public_access_order_items" ON "public"."OrderItem";
CREATE POLICY "deny_public_access_order_items"
  ON "public"."OrderItem"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

