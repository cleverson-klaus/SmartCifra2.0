import { Mic2 } from "lucide-react";
import AudioWaveform from "@/components/AudioWaveform";

export default function EstudioPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <Mic2 className="h-3 w-3" /> Análise em tempo real
        </div>
        <h1 className="text-3xl font-bold text-white">Estúdio — Professor IA</h1>
        <p className="mt-2 text-gray-400">
          Cante ou toque seu instrumento. O sistema detecta a nota e exibe sua afinação ao vivo.
        </p>
      </div>

      <AudioWaveform />

      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Como funciona</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>A Web Audio API captura o áudio do microfone em tempo real</li>
          <li>A detecção de nota usa autocorrelação para encontrar a frequência fundamental</li>
          <li>O medidor de cents mostra se você está acima (+) ou abaixo (−) da nota exata</li>
          <li>Feedback de IA avançado (ritmo, comparação com a cifra) será integrado em breve</li>
        </ul>
      </div>
    </div>
  );
}
