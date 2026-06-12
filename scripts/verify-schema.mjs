import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key, { auth: { persistSession: false } })

const tables = ['profiles', 'songs', 'chords']

console.log('🔍 Verificando tabelas no Supabase...\n')

let allOk = true

for (const table of tables) {
  const { error } = await supabase.from(table).select('id').limit(1)

  if (error && error.code === '42P01') {
    console.log(`❌ ${table} — tabela não encontrada (execute schema.sql primeiro)`)
    allOk = false
  } else if (error) {
    console.log(`⚠️  ${table} — erro inesperado: ${error.message}`)
  } else {
    console.log(`✅ ${table}`)
  }
}

if (allOk) {
  // Conta registros do seed
  const { count: songCount } = await supabase
    .from('songs')
    .select('*', { count: 'exact', head: true })

  console.log(`\n🎉 Banco pronto! ${songCount ?? 0} música(s) no seed.`)
} else {
  console.log('\n💡 Cole o conteúdo de supabase/schema.sql no SQL Editor do Supabase e execute.')
}
