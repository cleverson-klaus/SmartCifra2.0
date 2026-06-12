import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

const schemaSQL = readFileSync('./supabase/schema.sql', 'utf8')
const seedSQL   = readFileSync('./supabase/seed.sql',   'utf8')

async function run(label, sql) {
  console.log(`\n▶ Aplicando: ${label}...`)
  const { error } = await supabase.rpc('exec_sql', { query: sql }).throwOnError()
  if (error) throw error
  console.log(`✅ ${label} aplicado com sucesso.`)
}

// O Supabase não expõe exec_sql por padrão — usamos o endpoint de management
async function execSQL(sql) {
  const projectRef = url.replace('https://', '').split('.')[0]
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(json))
  return json
}

try {
  await execSQL(schemaSQL)
  console.log('✅ Schema criado com sucesso.')

  await execSQL(seedSQL)
  console.log('✅ Seed aplicado com sucesso.')

  console.log('\n🎉 Banco de dados pronto!')
} catch (err) {
  console.error('❌ Erro ao aplicar SQL:', err.message)
  console.log('\n💡 Se o erro persistir, aplique manualmente no Supabase:')
  console.log('   Dashboard → SQL Editor → cole o conteúdo de supabase/schema.sql')
  console.log('   Depois cole o conteúdo de supabase/seed.sql')
  process.exit(1)
}
