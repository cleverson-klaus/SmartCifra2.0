'use client'

import { useState } from 'react'
import { SlidersHorizontal, Mic2 } from 'lucide-react'
import clsx from 'clsx'
import AudioWaveform from './AudioWaveform'
import TomIdeal from './TomIdeal'

interface SongOption {
  id: string
  title: string
  artist: string
  original_key: string
}

interface Props {
  songs: SongOption[]
}

type Tab = 'afinador' | 'tom-ideal'

export default function EstudioWrapper({ songs }: Props) {
  const [tab, setTab] = useState<Tab>('afinador')

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1">
        <TabButton active={tab === 'afinador'} onClick={() => setTab('afinador')}>
          <SlidersHorizontal className="h-4 w-4" /> Afinador
        </TabButton>
        <TabButton active={tab === 'tom-ideal'} onClick={() => setTab('tom-ideal')}>
          <Mic2 className="h-4 w-4" /> Encontrar Meu Tom
        </TabButton>
      </div>

      {/* Conteúdo */}
      {tab === 'afinador' ? (
        <>
          <AudioWaveform />
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-500">
            <p className="mb-1 font-medium text-gray-400">Como funciona</p>
            <ul className="list-inside list-disc space-y-1">
              <li>A Web Audio API captura o áudio do microfone em tempo real</li>
              <li>A detecção de nota usa autocorrelação para encontrar a frequência fundamental</li>
              <li>O medidor de cents mostra se você está acima (+) ou abaixo (−) da nota exata</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <TomIdeal songs={songs} />
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-500">
            <p className="mb-1 font-medium text-gray-400">Como funciona</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Selecione a música e cante qualquer trecho (mínimo 10 segundos)</li>
              <li>O sistema detecta suas notas mais graves e mais agudas em tempo real</li>
              <li>O Professor IA calcula o tom ideal e sugere exercícios personalizados</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-gray-500 hover:text-gray-300'
      )}
    >
      {children}
    </button>
  )
}
