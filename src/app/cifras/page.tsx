import { Music2, Search } from "lucide-react";
import Link from "next/link";

// Dados mockados para o MVP — serão substituídos pelo Supabase no Passo 2
const mockSongs = [
  { id: "1", title: "Pais e Filhos", artist: "Legião Urbana", key: "G", bpm: 74 },
  { id: "2", title: "Admirável Chip Novo", artist: "Pitty", key: "Em", bpm: 148 },
  { id: "3", title: "Eduardo e Mônica", artist: "Legião Urbana", key: "D", bpm: 116 },
  { id: "4", title: "Garota de Ipanema", artist: "Tom Jobim", key: "F", bpm: 130 },
  { id: "5", title: "Paranoid Android", artist: "Radiohead", key: "C", bpm: 82 },
  { id: "6", title: "Wish You Were Here", artist: "Pink Floyd", key: "G", bpm: 63 },
];

export default function CifrasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cifras</h1>
          <p className="mt-1 text-gray-400">Explore e toque suas músicas favoritas</p>
        </div>
        <Link
          href="/gerador"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Gerar cifra
        </Link>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por música ou artista..."
          className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Lista de músicas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mockSongs.map((song) => (
          <Link
            key={song.id}
            href={`/cifras/${song.id}`}
            className="group flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Music2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-white group-hover:text-indigo-300">
                {song.title}
              </p>
              <p className="truncate text-sm text-gray-500">{song.artist}</p>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-300">
                {song.key}
              </span>
              <p className="mt-1 text-xs text-gray-600">{song.bpm} BPM</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
