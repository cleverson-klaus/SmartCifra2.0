import Link from 'next/link'
import { Music2, Zap, Mic2, ArrowRight, GraduationCap } from 'lucide-react'

const features = [
  {
    icon: Music2,
    title: 'Cifras Inteligentes',
    description:
      'Visualize letra e acordes em sincronia com auto-scroll, transposição de tom instantânea e player integrado.',
    href: '/cifras',
    cta: 'Ver cifras',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30 hover:border-indigo-500/70',
  },
  {
    icon: Zap,
    title: 'Gerador Automático',
    description:
      'Cole um link do YouTube, faça upload de um MP3 ou busque a letra. A IA detecta acordes e gera a cifra.',
    href: '/gerador',
    cta: 'Gerar cifra',
    color: 'text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-500/70',
  },
  {
    icon: GraduationCap,
    title: 'Professor IA',
    description:
      'Tire dúvidas de teoria musical, harmonia e técnica com um professor virtual disponível 24h.',
    href: '/professor',
    cta: 'Falar com professor',
    color: 'text-violet-400',
    border: 'border-violet-500/30 hover:border-violet-500/70',
  },
  {
    icon: Mic2,
    title: 'Estúdio Vocal',
    description:
      'Cante e descubra qual tom é ideal para sua voz. O sistema analisa seu alcance e dá dicas de técnica.',
    href: '/estudio',
    cta: 'Abrir estúdio',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-500/70',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      {/* Hero */}
      <div className="mb-14 text-center sm:mb-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <Zap className="h-3.5 w-3.5" />
          Powered by IA
        </div>
        <h1 className="mb-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Aprenda música do seu{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            jeito
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-gray-400 sm:text-lg">
          Cifras inteligentes, professor de IA e geração automática de cifras a partir de qualquer
          áudio. Tudo em um só lugar.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/cifras"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 sm:w-auto"
          >
            Explorar cifras <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/gerador"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white sm:w-auto"
          >
            Gerar cifra com IA
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, description, href, cta, color, border }) => (
          <div
            key={href}
            className={`group rounded-2xl border bg-gray-900 p-5 transition-all duration-200 sm:p-6 ${border}`}
          >
            <Icon className={`mb-4 h-7 w-7 sm:h-8 sm:w-8 ${color}`} />
            <h2 className="mb-2 text-base font-semibold text-white sm:text-lg">{title}</h2>
            <p className="mb-5 text-sm leading-relaxed text-gray-400">{description}</p>
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
  )
}
