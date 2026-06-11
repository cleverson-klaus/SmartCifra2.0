import { notFound } from "next/navigation";
import { Music2 } from "lucide-react";

// Dados mockados — serão substituídos por query Supabase no Passo 2
const mockSongs: Record<string, { title: string; artist: string; key: string; bpm: number; content: string }> = {
  "1": {
    title: "Pais e Filhos",
    artist: "Legião Urbana",
    key: "G",
    bpm: 74,
    content: `[G]Nada vai me fazer [D]desistir
[Em]Minha vida passou [C]por aqui
[G]Pais e filhos [D]se entendem
[Em]No fim as pedras [C]cedem`,
  },
  "2": {
    title: "Admirável Chip Novo",
    artist: "Pitty",
    key: "Em",
    bpm: 148,
    content: `[Em]Pane no sistema, [G]alguém me deletou
[D]Não era um vírus, [A]era um usuário
[Em]Fui programada pra [G]te encontrar
[D]Mas errei o [A]programa`,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CifraDetailPage({ params }: Props) {
  const { id } = await params;
  const song = mockSongs[id];

  if (!song) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header da música */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Music2 className="h-7 w-7 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{song.title}</h1>
          <p className="text-gray-400">{song.artist}</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-300">
              Tom: {song.key}
            </span>
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
              {song.bpm} BPM
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo da cifra — parsing visual simples */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <pre className="font-mono text-sm leading-8 text-gray-300 whitespace-pre-wrap">
          {song.content}
        </pre>
      </div>

      <p className="mt-6 text-center text-xs text-gray-600">
        O visualizador interativo com acordes sobre as palavras será construído no Passo 3.
      </p>
    </div>
  );
}
