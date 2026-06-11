import { Mic2, Music2, BarChart2 } from "lucide-react";

export default function EstudioPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <Mic2 className="h-3 w-3" /> Análise em tempo real
        </div>
        <h1 className="text-3xl font-bold text-white">Estúdio — Professor IA</h1>
        <p className="mt-2 text-gray-400">
          Cante ou toque seu instrumento. A IA analisa sua afinação e ritmo em tempo real.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Card: Microfone */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <Mic2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h2 className="mb-1 font-semibold text-white">Microfone</h2>
          <p className="text-sm text-gray-400">
            Captura o áudio do seu microfone via Web Audio API
          </p>
          <div className="mt-4 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
            Permissão necessária
          </div>
        </div>

        {/* Card: Análise de tom */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
            <Music2 className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="mb-1 font-semibold text-white">Tom & Afinação</h2>
          <p className="text-sm text-gray-400">
            Detecta a nota cantada/tocada e compara com o alvo
          </p>
          <div className="mt-4 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
            Aguardando entrada
          </div>
        </div>

        {/* Card: Ritmo */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <BarChart2 className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="mb-1 font-semibold text-white">Ritmo & Tempo</h2>
          <p className="text-sm text-gray-400">
            Analisa se você está no compasso certo
          </p>
          <div className="mt-4 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
            Aguardando entrada
          </div>
        </div>
      </div>

      {/* Visualizador de ondas — placeholder */}
      <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Forma de Onda</span>
          <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
            Inativo
          </span>
        </div>
        {/* Visualizador será implementado com Web Audio API no Passo 4 */}
        <div className="flex h-24 items-center justify-center rounded-xl bg-gray-800">
          <p className="text-sm text-gray-600">
            Clique em &quot;Iniciar microfone&quot; para ver a forma de onda
          </p>
        </div>
        <button className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-500">
          Iniciar microfone
        </button>
      </div>
    </div>
  );
}
