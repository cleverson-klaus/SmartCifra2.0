import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChordViewer from "@/components/ChordViewer";
import ShareButton from "@/components/ShareButton";
import { Music2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Song, Chord } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CifraDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: songData, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !songData) notFound();
  const song = songData as Song;

  const { data: chordsData } = await supabase
    .from("chords")
    .select("*")
    .eq("song_id", id)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1);

  const chord = (chordsData as Chord[] | null)?.[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/cifras"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para cifras
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Music2 className="h-7 w-7 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-white">{song.title}</h1>
            <ShareButton songId={song.id} title={song.title} />
          </div>
          <p className="text-gray-400">{song.artist}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-300">
              Tom original: {song.original_key}
            </span>
            {song.bpm && (
              <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                {song.bpm} BPM
              </span>
            )}
          </div>
        </div>
      </div>


      {chord ? (
        <ChordViewer
          content={chord.content}
          originalKey={song.original_key}
          title={song.title}
          artist={song.artist}
          bpm={song.bpm}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700 p-10 text-center text-gray-500">
          Nenhuma cifra cadastrada para esta música ainda.
        </div>
      )}
    </div>
  );
}
