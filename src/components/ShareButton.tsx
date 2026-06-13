'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  songId: string
  title: string
}

export default function ShareButton({ songId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/cifras/${songId}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // fallback para clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400">Link copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          Compartilhar
        </>
      )}
    </button>
  )
}
