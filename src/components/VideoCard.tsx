import { ExternalLink, PlayCircle } from 'lucide-react'
import type { YouTubeVideo } from '@/lib/professor/tools'

interface VideoCardProps {
  videos: YouTubeVideo[]
  contexto: string
}

export default function VideoCard({ videos, contexto }: VideoCardProps) {
  return (
    <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-red-400" />
        <span className="text-sm font-semibold text-red-300">Vídeos recomendados</span>
      </div>
      <p className="mb-3 text-xs text-gray-400">{contexto}</p>

      <div className="space-y-2">
        {videos.map((video, i) => (
          <a
            key={video.id || i}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3 transition-colors hover:border-red-800/50 hover:bg-red-950/20"
          >
            {video.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-14 w-24 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-800">
                <PlayCircle className="h-6 w-6 text-gray-600" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-white leading-snug">
                {video.title}
              </p>
              {video.channel && (
                <p className="mt-0.5 text-xs text-gray-500">{video.channel}</p>
              )}
            </div>

            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          </a>
        ))}
      </div>
    </div>
  )
}
