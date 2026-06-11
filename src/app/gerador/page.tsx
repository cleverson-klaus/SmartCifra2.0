import { PlayCircle, Upload, Zap } from "lucide-react";

export default function GeradorPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          <Zap className="h-3 w-3" /> IA em ação
        </div>
        <h1 className="text-3xl font-bold text-white">Gerador de Cifras</h1>
        <p className="mt-2 text-gray-400">
          Cole um link do YouTube ou faça upload de um MP3 para gerar a cifra automaticamente.
        </p>
      </div>

      <div className="space-y-6">
        {/* YouTube URL */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-red-400">
            <PlayCircle className="h-5 w-5" />
            <span className="font-medium">Link do YouTube / SoundCloud</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-400 focus:outline-none"
              />
            <button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500">
              Gerar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex-1 border-t border-gray-800" />
          <span>ou</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Upload MP3 */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Upload className="h-5 w-5" />
            <span className="font-medium">Upload de arquivo MP3</span>
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-700 p-8 text-center transition-colors hover:border-amber-500/50 hover:bg-amber-500/5">
            <Upload className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-300">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-gray-600">MP3, WAV, M4A — máx. 50 MB</p>
            </div>
            <input type="file" accept="audio/*" className="hidden" />
          </label>
        </div>

        {/* Aviso de processamento futuro */}
        <p className="text-center text-xs text-gray-600">
          O processamento de IA será integrado no Passo 3. Por enquanto, a interface está pronta.
        </p>
      </div>
    </div>
  );
}
