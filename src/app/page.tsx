import Link from "next/link";
import { Music2, Zap, Mic2, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Music2,
    title: "Cifras Inteligentes",
    description:
      "Visualize letra e acordes em sincronia com auto-scroll, transposição de tom instantânea e player integrado.",
    href: "/cifras",
    cta: "Ver cifras",
    color: "text-indigo-400",
    border: "border-indigo-500/30 hover:border-indigo-500/70",
  },
  {
    icon: Zap,
    title: "Gerador Automático",
    description:
      "Cole um link do YouTube ou faça upload de um MP3. A IA extrai a letra, detecta acordes e gera a cifra para você.",
    href: "/gerador",
    cta: "Gerar cifra",
    color: "text-amber-400",
    border: "border-amber-500/30 hover:border-amber-500/70",
  },
  {
    icon: Mic2,
    title: "Professor IA",
    description:
      "Cante ou toque seu instrumento. O sistema analisa sua afinação e ritmo em tempo real e dá feedback visual.",
    href: "/estudio",
    cta: "Abrir estúdio",
    color: "text-emerald-400",
    border: "border-emerald-500/30 hover:border-emerald-500/70",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      {/* Hero */}
      <div className="mb-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <Zap className="h-3.5 w-3.5" />
          Powered by IA
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Aprenda música do seu{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            jeito
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
          Cifras inteligentes, professor de IA e geração automática de cifras a partir de qualquer
          áudio. Tudo em um só lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/cifras"
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Explorar cifras <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/gerador"
            className="flex items-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            Gerar cifra com IA
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description, href, cta, color, border }) => (
          <div
            key={href}
            className={`group rounded-2xl border bg-gray-900 p-6 transition-all duration-200 ${border}`}
          >
            <Icon className={`mb-4 h-8 w-8 ${color}`} />
            <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">{description}</p>
            <Link
              href={href}
              className={`flex items-center gap-1 text-sm font-medium ${color} transition-opacity hover:opacity-80`}
            >
              {cta} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
