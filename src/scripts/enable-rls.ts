import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

function loadEnvConnection(): string {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

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

  try {
    console.log('1. Conectando ao banco Supabase...');
    await client.connect();

    console.log('2. Verificando status atual do RLS nas tabelas do schema public...');
    const beforeRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.table(beforeRes.rows);

    const sqlPath = path.resolve(process.cwd(), 'prisma', 'enable_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('3. Aplicando RLS e políticas de segurança...');
    await client.query(sql);

    // Garantir que qualquer tabela extra no schema public (ex: _prisma_migrations) também tenha RLS ativo
    for (const row of beforeRes.rows) {
      if (!row.rowsecurity) {
        await client.query(`ALTER TABLE "public"."${row.tablename}" ENABLE ROW LEVEL SECURITY;`);
      }
    }

    console.log('4. Verificando status final do RLS e políticas...');
    const afterRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.table(afterRes.rows);

    const policiesRes = await client.query(`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    console.table(policiesRes.rows);

    console.log('5. Testando bloqueio de acesso anônimo (role anon) em Order...');
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE anon');
    let anonOrderBlocked = false;
    try {
      await client.query('SELECT count(*) FROM "public"."Order"');
    } catch (e: any) {
      anonOrderBlocked = true;
      console.log(`   ✓ Acesso anon à tabela Order bloqueado com sucesso (${e.message})`);
    }
    await client.query('ROLLBACK');

    if (!anonOrderBlocked) {
      throw new Error('Falha na verificação: role anon ainda conseguiu consultar Order.');
    }

    const serverOrderCount = await client.query('SELECT count(*) FROM "public"."Order"');
    const serverProductCount = await client.query('SELECT count(*) FROM "public"."Product"');
    console.log(
      `   ✓ Acesso do servidor (Prisma/postgres) preservado: ${serverProductCount.rows[0].count} produtos, ${serverOrderCount.rows[0].count} pedidos.`
    );

    console.log('\n✅ RLS ativado e verificado com sucesso em todas as tabelas do schema public!');
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error('❌ Erro ao aplicar RLS:', err);
  process.exit(1);
});
