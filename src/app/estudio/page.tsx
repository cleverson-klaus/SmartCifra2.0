import { Mic2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EstudioWrapper from '@/components/EstudioWrapper'

export const metadata = { title: 'Estúdio — SmartCifra' }

export default async function EstudioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let songs: { id: string; title: string; artist: string; original_key: string }[] = []

  if (user) {
    const { data } = await supabase
      .from('songs')
      .select('id, title, artist, original_key')
      .eq('user_id', user.id)
      .order('title')
    songs = data ?? []
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <Mic2 className="h-3 w-3" /> Análise em tempo real
        </div>
        <h1 className="text-3xl font-bold text-white">Estúdio — Professor IA</h1>
        <p className="mt-2 text-gray-400">
          Afine sua voz ou descubra qual tom é perfeito para você cantar.
        </p>
      </div>

      <EstudioWrapper songs={songs} />
    </div>
  )
}
