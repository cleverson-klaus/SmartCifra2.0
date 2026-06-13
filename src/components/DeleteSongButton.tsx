'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteSong } from '@/lib/actions/songs'

interface DeleteSongButtonProps {
  songId: string
  songTitle: string
}

export default function DeleteSongButton({ songId, songTitle }: DeleteSongButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteSong(songId)
    if (result.error) {
      alert(result.error)
      setLoading(false)
      setConfirming(false)
    }
    // Se deletou com sucesso, revalidatePath vai atualizar a lista automaticamente
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Deletar "{songTitle}"?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Confirmar
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-red-950/40 hover:text-red-400"
      title="Deletar cifra"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
