'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import type { Exercise } from '@/lib/professor/tools'

const DIFICULDADE_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const DIFICULDADE_COLOR: Record<string, string> = {
  iniciante: 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
  intermediario: 'text-amber-400 bg-amber-950/40 border-amber-800',
  avancado: 'text-red-400 bg-red-950/40 border-red-800',
}

interface ExerciseCardProps {
  exercise: Exercise
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const answered = selected !== null
  const isCorrect = selected === exercise.resposta_correta

  function handleSelect(opcao: string) {
    if (answered && isCorrect) return
    setSelected(opcao)
    setAttempts((a) => a + 1)
  }

  function handleReset() {
    setSelected(null)
    setShowHint(false)
  }

  return (
    <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <span className="text-sm font-semibold text-indigo-300">Exercício Prático</span>
        </div>
        <span
          className={clsx(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
            DIFICULDADE_COLOR[exercise.dificuldade] ?? DIFICULDADE_COLOR.iniciante
          )}
        >
          {DIFICULDADE_LABEL[exercise.dificuldade] ?? exercise.dificuldade}
        </span>
      </div>

      {/* Tópico */}
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
        {exercise.topico}
      </p>

      {/* Pergunta */}
      <p className="mb-4 text-sm font-medium text-white leading-relaxed">
        {exercise.pergunta}
      </p>

      {/* Opções */}
      <div className="space-y-2">
        {exercise.opcoes.map((opcao) => {
          const isSelected = selected === opcao
          const isRight = opcao === exercise.resposta_correta

          let style = 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-indigo-600/60 hover:bg-indigo-950/30'

          if (answered) {
            if (isRight) {
              style = 'border-emerald-600 bg-emerald-950/40 text-emerald-200'
            } else if (isSelected && !isRight) {
              style = 'border-red-600 bg-red-950/40 text-red-300'
            } else {
              style = 'border-gray-800 bg-gray-900/40 text-gray-500'
            }
          }

          return (
            <button
              key={opcao}
              onClick={() => handleSelect(opcao)}
              disabled={answered && isCorrect}
              className={clsx(
                'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                style
              )}
            >
              <span className="font-mono">{opcao}</span>
              {answered && isRight && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
              {answered && isSelected && !isRight && <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="mt-4 space-y-3">
          {isCorrect ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-800 bg-emerald-950/30 px-4 py-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Correto! {attempts === 1 ? '🎉 Na primeira tentativa!' : `Conseguiu em ${attempts} tentativas.`}
                </p>
                <p className="mt-1 text-xs text-emerald-400/80 leading-relaxed">
                  {exercise.explicacao}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-red-900 bg-red-950/20 px-4 py-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">Não foi dessa vez — tente novamente!</p>
                {exercise.dica && !showHint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="mt-1.5 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  >
                    <Lightbulb className="h-3 w-3" /> Ver dica
                  </button>
                )}
                {showHint && exercise.dica && (
                  <p className="mt-1.5 text-xs text-amber-300 leading-relaxed">
                    💡 {exercise.dica}
                  </p>
                )}
              </div>
            </div>
          )}

          {!isCorrect && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Tentar novamente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
