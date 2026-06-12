"use client";

import { useState } from "react";
import Link from "next/link";
import { Music2, Search } from "lucide-react";
import type { Song } from "@/types/database";

interface Props {
  songs: Pick<Song, "id" | "title" | "artist" | "original_key" | "bpm">[];
}

export default function SongList({ songs }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      )
    : songs;

  return (
    <>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por música ou artista..."
          className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-gray-500">Nenhuma música encontrada.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((song) => (
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
                  {song.original_key}
                </span>
                {song.bpm && (
                  <p className="mt-1 text-xs text-gray-600">{song.bpm} BPM</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
