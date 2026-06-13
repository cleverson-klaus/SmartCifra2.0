import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Music2, ArrowLeft, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DeleteSongButton from '@/components/DeleteSongButton'
import type { Song } from '@/types/database'

export const metadata = { title: 'Minhas Cifras — SmartCifra' }

export default async function MinhasCifrasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar')

  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const songs = (data ?? []) as Song[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/cifras"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todas as cifras
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Cifras</h1>
          <p className="mt-1 text-sm text-gray-500">
            {songs.length === 0
              ? 'Você ainda não salvou nenhuma cifra.'
              : `${songs.length} cifra${songs.length !== 1 ? 's' : ''} salva${songs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/gerador"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" />
          Nova cifra
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
          <Music2 className="mx-auto mb-4 h-10 w-10 text-gray-700" />
          <p className="text-gray-500">Gere sua primeira cifra no Gerador!</p>
          <Link
            href="/gerador"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <PlusCircle className="h-4 w-4" /> Ir para o Gerador
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {songs.map((song) => (
            <li
              key={song.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3.5 transition-colors hover:border-gray-700"
            >
              <Link href={`/cifras/${song.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Music2 className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{song.title}</p>
                  <p className="truncate text-sm text-gray-500">{song.artist}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-2 pr-2">
                  <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-400">
                    {song.original_key}
                  </span>
                  {song.bpm && (
                    <span className="hidden rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400 sm:block">
                      {song.bpm} BPM
                    </span>
                  )}
                </div>
              </Link>
              <DeleteSongButton songId={song.id} songTitle={song.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
