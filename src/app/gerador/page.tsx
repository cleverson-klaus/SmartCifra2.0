import { Zap } from "lucide-react";
import GeradorForm from "@/components/GeradorForm";

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

      <GeradorForm />
    </div>
  );
}
