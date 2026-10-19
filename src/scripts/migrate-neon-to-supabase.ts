import { Client } from 'pg';

const neonConnectionString = 'postgresql://neondb_owner:npg_5CINHRX2nBiQ@ep-quiet-poetry-b460ygto-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const supabaseConnectionString = 'postgresql://postgres.ugdbzhkdxxfndjcfqssm:Rafa%23Guimaraes4@aws-0-us-east-2.pooler.supabase.com:5432/postgres';

async function migrateTable(
  neonClient: Client,
  supabaseClient: Client,
  tableName: string
) {
  console.log(`\n📦 Migrando tabela "${tableName}"...`);

  // Busca colunas do Neon
  const neonColsRes = await neonClient.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = $1
  `, [tableName]);
  const neonCols = new Set(neonColsRes.rows.map(r => r.column_name));

  // Busca colunas do Supabase
  const supaColsRes = await supabaseClient.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = $1
  `, [tableName]);
  const supaCols = new Set(supaColsRes.rows.map(r => r.column_name));

  // Colunas comuns em ambos os bancos
  const commonCols = Array.from(neonCols).filter(c => supaCols.has(c));
  console.log(`   Colunas correspondentes (${commonCols.length}):`, commonCols.join(', '));

  if (commonCols.length === 0) {
    console.log(`   ⚠️ Nenhuma coluna compatível para ${tableName}. Pulando.`);
    return 0;
  }

  // Busca todos os registros do Neon
  const colsQuoted = commonCols.map(c => `"${c}"`).join(', ');
  const rowsRes = await neonClient.query(`SELECT ${colsQuoted} FROM "${tableName}"`);
  console.log(`   Encontrados ${rowsRes.rows.length} registros no Neon.`);

  if (rowsRes.rows.length === 0) {
    return 0;
  }

  let inserted = 0;
  for (const row of rowsRes.rows) {
    const values = commonCols.map(c => row[c]);
    const placeholders = commonCols.map((_, i) => `$${i + 1}`).join(', ');
    const insertSql = `INSERT INTO "${tableName}" (${colsQuoted}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    await supabaseClient.query(insertSql, values);
    inserted++;
  }

  console.log(`   ✓ Sucesso: ${inserted} registros inseridos em "${tableName}" no Supabase!`);
  return inserted;
}

async function migrate() {
  console.log('🚀 Iniciando Migração Completa: Neon -> Supabase...\n');

  const neonClient = new Client({ connectionString: neonConnectionString, ssl: { rejectUnauthorized: false } });
  const supabaseClient = new Client({ connectionString: supabaseConnectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('1. Conectando aos dois bancos de dados...');
    await neonClient.connect();
    console.log('   ✓ Conectado ao Neon (pooler)!');
    await supabaseClient.connect();
    console.log('   ✓ Conectado ao Supabase (pooler direct 5432)!\n');

    // Ordem correta para respeitar Foreign Keys
    const tables = [
      'PromotionalBatch',
      'WholesaleTier',
      'Product',
      'ProductVariant',
      'Order',
      'OrderItem',
    ];

    console.log('2. Contagem atual no Neon:');
    for (const t of tables) {
      const res = await neonClient.query(`SELECT count(*) FROM "${t}"`);
      console.log(`   - ${t}: ${res.rows[0].count} registros`);
    }

    console.log('\n3. Limpando dados de demonstração (seed) temporários no Supabase...');
    await supabaseClient.query(`
      TRUNCATE "OrderItem", "Order", "ProductVariant", "Product", "WholesaleTier", "PromotionalBatch" CASCADE;
    `);
    console.log('   ✓ Banco Supabase limpo e pronto para receber os dados originais!');

    const results: Record<string, number> = {};

    for (const t of tables) {
      results[t] = await migrateTable(neonClient, supabaseClient, t);
    }

    console.log('\n========================================');
    console.log('🎉 RESUMO DA MIGRAÇÃO CONCLUÍDA COM TOTAL SUCESSO:');
    console.log('========================================');
    for (const [t, count] of Object.entries(results)) {
      console.log(`- ${t}: ${count} registros restaurados no Supabase`);
    }
    console.log('========================================\n');

  } catch (err: any) {
    console.error('\n❌ Erro durante a migração:', err);
  } finally {
    await neonClient.end().catch(() => {});
    await supabaseClient.end().catch(() => {});
  }
}

migrate();
