import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Variáveis de ambiente não encontradas.')
  process.exit(1)
}

console.log('🔗 Conectando em:', url)

const supabase = createClient(url, key)

// Testa a conexão fazendo uma query simples
const { data, error } = await supabase
  .from('_supabase_migrations') // tabela interna do Supabase
  .select('version')
  .limit(1)

if (error) {
  // Erro esperado se a tabela não existir ainda — mas a conexão funcionou
  if (error.code === '42P01' || error.message.includes('does not exist')) {
    console.log('✅ Conexão com Supabase OK! (banco ainda sem tabelas customizadas — normal para projeto novo)')
  } else if (error.code === 'PGRST301' || error.message.includes('JWT')) {
    console.error('❌ Erro de autenticação — verifique a ANON_KEY:', error.message)
  } else {
    console.log('✅ Conexão estabelecida. Resposta do servidor:', error.message)
  }
} else {
  console.log('✅ Conexão com Supabase OK! Dados recebidos:', data)
}
