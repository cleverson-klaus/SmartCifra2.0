import { createClient } from "@/lib/supabase/server";
import SongList from "@/components/SongList";
import Link from "next/link";
import type { Song } from "@/types/database";

export default async function CifrasPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("songs")
    .select("id, title, artist, original_key, bpm")
    .eq("is_public", true)
    .order("title");

  const songs = (data ?? []) as Pick<Song, "id" | "title" | "artist" | "original_key" | "bpm">[];

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

      <SongList songs={songs} />
    </div>
  );
}
