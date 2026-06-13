'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, FileText } from 'lucide-react'

interface LyricsData {
  title: string
  artist: string
  lyrics: string
}

interface Props {
  onSubmit: (data: { lyrics: string; title: string; artist: string }) => void
  isProcessing: boolean
}

export default function LetraTab({ onSubmit, isProcessing }: Props) {
  const [art, setArt] = useState('')
  const [mus, setMus] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [found, setFound] = useState<LyricsData | null>(null)

  // Manual
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [manualLyrics, setManualLyrics] = useState('')
  const [mode, setMode] = useState<'search' | 'manual'>('search')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!art.trim() || !mus.trim()) return
    setSearchError('')
    setFound(null)
    setSearching(true)

    try {
      const params = new URLSearchParams({ art: art.trim(), mus: mus.trim() })
      const res = await fetch(`/api/lyrics/search?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setSearchError(data.error ?? 'Erro desconhecido.')
      } else {
        setFound(data as LyricsData)
      }
    } catch {
      setSearchError('Erro de conexão. Tente novamente.')
    } finally {
      setSearching(false)
    }
  }

  function handleUseFound() {
    if (!found) return
    onSubmit({ lyrics: found.lyrics, title: found.title, artist: found.artist })
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualLyrics.trim()) return
    onSubmit({ lyrics: manualLyrics.trim(), title: manualTitle, artist: manualArtist })
  }

  return (
    <div className="space-y-5">
      {/* Alternância busca / manual */}
      <div className="flex rounded-lg border border-gray-700 bg-gray-800/50 p-0.5">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'search' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Search className="h-3.5 w-3.5" /> Buscar letra
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'manual' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> Colar letra
        </button>
      </div>

      {/* ── Busca Vagalume ── */}
      {mode === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Artista</label>
                <input
                  value={art}
                  onChange={e => setArt(e.target.value)}
                  placeholder="Ex: Roberto Carlos"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Música</label>
                <input
                  value={mus}
                  onChange={e => setMus(e.target.value)}
                  placeholder="Ex: Evidências"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!art.trim() || !mus.trim() || searching}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-950/50 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-900/50 disabled:opacity-40"
            >
              {searching
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
                : <><Search className="h-4 w-4" /> Buscar letra</>}
            </button>
          </form>

          {searchError && (
            <p className="flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {searchError}
            </p>
          )}

          {found && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-4 py-3">
                <p className="font-medium text-white">{found.title}</p>
                <p className="text-sm text-gray-400">{found.artist}</p>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-3">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-400">
                  {found.lyrics.slice(0, 600)}{found.lyrics.length > 600 ? '\n...' : ''}
                </pre>
              </div>
              <button
                type="button"
                onClick={handleUseFound}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {isProcessing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando cifra...</>
                  : '✨ Gerar cifra com esta letra'}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-600">
            Letras fornecidas via{' '}
            <a href="https://lyrics.ovh" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 underline">
              lyrics.ovh
            </a>
          </p>
        </div>
      )}

      {/* ── Colar letra manualmente ── */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Título <span className="text-gray-600">(opcional)</span>
              </label>
              <input
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="Nome da música"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Artista <span className="text-gray-600">(opcional)</span>
              </label>
              <input
                value={manualArtist}
                onChange={e => setManualArtist(e.target.value)}
                placeholder="Nome do artista"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Letra da música</label>
            <textarea
              value={manualLyrics}
              onChange={e => setManualLyrics(e.target.value)}
              rows={10}
              placeholder={"Cole aqui a letra completa da música...\n\nExemplo:\nEu sei que vou te amar\nPor toda a minha vida vou te amar\n..."}
              className="w-full resize-y rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!manualLyrics.trim() || isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            {isProcessing
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando cifra...</>
              : '✨ Gerar cifra'}
          </button>
        </form>
      )}
    </div>
  )
}
