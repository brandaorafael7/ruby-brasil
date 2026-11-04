import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

function loadEnvConnection(): string {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const directMatch = content.match(/^DIRECT_URL=["']?([^"'\r\n]+)["']?/m);
    if (directMatch?.[1]) return directMatch[1];
    const dbMatch = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (dbMatch?.[1]) return dbMatch[1];
  }
  throw new Error('DIRECT_URL ou DATABASE_URL não encontrada no .env');
}

async function run() {
  const connectionString = loadEnvConnection();
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    console.log('1. Criando tabela ProductImage (com RLS ativo) e índices de performance...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."ProductImage" (
        "productId" TEXT PRIMARY KEY REFERENCES "public"."Product"("id") ON DELETE CASCADE,
        "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
        "data" BYTEA NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE "public"."ProductImage" ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON TABLE "public"."ProductImage" FROM anon, authenticated;

      DROP POLICY IF EXISTS "deny_public_access_product_images" ON "public"."ProductImage";
      CREATE POLICY "deny_public_access_product_images"
        ON "public"."ProductImage"
        AS RESTRICTIVE
        FOR ALL
        TO anon, authenticated
        USING (false)
        WITH CHECK (false);

      CREATE INDEX IF NOT EXISTS "Product_isActive_createdAt_idx" ON "public"."Product"("isActive", "createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "public"."Product"("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId");
      CREATE INDEX IF NOT EXISTS "WholesaleTier_productId_idx" ON "public"."WholesaleTier"("productId");
      CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "public"."Order"("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "public"."Order"("status");
      CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");
      CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "public"."OrderItem"("productId");
    `);
    console.log('   ✓ Tabela ProductImage (com RLS) e índices B-Tree criados!');

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('2. Buscando produtos com imagens Base64 na coluna Product.imageUrl...');
    const res = await client.query(`
      SELECT "id", "imageUrl"
      FROM "public"."Product"
      WHERE "imageUrl" LIKE 'data:image/%'
    `);

    console.log(`   Encontrados ${res.rows.length} produtos com Base64 embutido.`);

    let migrated = 0;
    for (const row of res.rows) {
      const match = String(row.imageUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
      if (!match) continue;

      const mimeType = match[1] || 'image/webp';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Salva cópia estática em public/uploads/products/<id>.webp para entrega instantânea via CDN
      const filePath = path.join(uploadsDir, `${row.id}.webp`);
      fs.writeFileSync(filePath, buffer);

      // Salva também em ProductImage no banco e atualiza Product.imageUrl para a URL estática leve
      const cleanUrl = `/uploads/products/${row.id}.webp`;

      await client.query(
        `
        INSERT INTO "public"."ProductImage" ("productId", "mimeType", "data", "updatedAt")
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT ("productId")
        DO UPDATE SET
          "mimeType" = EXCLUDED."mimeType",
          "data" = EXCLUDED."data",
          "updatedAt" = NOW()
        `,
        [row.id, mimeType, buffer]
      );

      await client.query(
        `UPDATE "public"."Product" SET "imageUrl" = $1 WHERE "id" = $2`,
        [cleanUrl, row.id]
      );

      migrated++;
    }

    console.log(`   ✓ ${migrated} imagens migradas de Base64 para arquivos .webp + ProductImage!`);

    console.log('3. Executando VACUUM ANALYZE nas tabelas principais para atualizar estatísticas do planejador...');
    await client.query('VACUUM ANALYZE "public"."Product";');
    await client.query('VACUUM ANALYZE "public"."ProductVariant";');
    await client.query('VACUUM ANALYZE "public"."Order";');
    await client.query('VACUUM ANALYZE "public"."OrderItem";');

    const sizeCheck = await client.query(`
      SELECT
        count(*) as total_products,
        sum(length("imageUrl")) as total_image_url_bytes
      FROM "public"."Product"
    `);
    console.log('4. Resultado após otimização:', sizeCheck.rows[0]);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('❌ Erro na otimização:', err);
  process.exit(1);
});

