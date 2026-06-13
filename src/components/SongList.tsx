'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Music2, Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { Song } from '@/types/database'

interface Props {
  songs: Pick<Song, 'id' | 'title' | 'artist' | 'original_key' | 'bpm' | 'genre'>[]
}

export default function SongList({ songs }: Props) {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

  // Gêneros presentes nas cifras (sem duplicatas, ordenados)
  const availableGenres = useMemo(() => {
    const genres = songs
      .map(s => s.genre)
      .filter((g): g is string => !!g)
    return [...new Set(genres)].sort()
  }, [songs])

  const filtered = useMemo(() => {
    return songs.filter(s => {
      const matchQuery =
        !query.trim() ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())

      const matchGenre = !activeGenre || s.genre === activeGenre

      return matchQuery && matchGenre
    })
  }, [songs, query, activeGenre])

  return (
    <>
      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por música ou artista..."
          className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros de gênero */}
      {availableGenres.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGenre(null)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              !activeGenre
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            )}
          >
            Todos
          </button>
          {availableGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeGenre === genre
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Resultado */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500">Nenhuma música encontrada.</p>
          {(query || activeGenre) && (
            <button
              onClick={() => { setQuery(''); setActiveGenre(null) }}
              className="mt-3 text-sm text-indigo-400 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-600">
            {filtered.length} cifra{filtered.length !== 1 ? 's' : ''}
            {activeGenre ? ` em ${activeGenre}` : ''}
            {query ? ` para "${query}"` : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(song => (
              <Link
                key={song.id}
                href={`/cifras/${song.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Music2 className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white group-hover:text-indigo-300">
                    {song.title}
                  </p>
                  <p className="truncate text-sm text-gray-500">{song.artist}</p>
                  {song.genre && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-950/60 px-2 py-0.5 text-xs text-indigo-400">
                      {song.genre}
                    </span>
                  )}
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-300">
                    {song.original_key}
                  </span>
                  {song.bpm && (
                    <p className="mt-1 text-xs text-gray-600">{song.bpm} BPM</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
