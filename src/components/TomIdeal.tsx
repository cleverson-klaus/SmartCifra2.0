'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic2, MicOff, Square, Loader2, RotateCcw, Music2 } from 'lucide-react'
import clsx from 'clsx'

// ── Pitch detection (autocorrelação) ──────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToMidi(freq: number): number | null {
  if (freq < 60 || freq > 2000) return null
  const midi = 12 * Math.log2(freq / 440) + 69
  const rounded = Math.round(midi)
  if (rounded < 36 || rounded > 84) return null // C2 a C6 — faixa vocal
  return rounded
}

function midiToName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

function detectPitch(buffer: Float32Array<ArrayBuffer>, sampleRate: number): number | null {
  const SIZE = buffer.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.02) return null

  const correlations = new Float32Array(SIZE) as Float32Array<ArrayBuffer>
  for (let lag = 0; lag < SIZE; lag++) {
    let sum = 0
    for (let i = 0; i < SIZE - lag; i++) sum += buffer[i] * buffer[i + lag]
    correlations[lag] = sum
  }

  let start = 0
  while (start < SIZE / 2 && correlations[start] > correlations[start + 1]) start++

  let maxVal = -Infinity
  let maxLag = -1
  for (let i = start; i < SIZE / 2; i++) {
    if (correlations[i] > maxVal) { maxVal = correlations[i]; maxLag = i }
  }

  if (maxLag === -1 || maxVal < 0.01) return null
  return sampleRate / maxLag
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface SongOption {
  id: string
  title: string
  artist: string
  original_key: string
}

interface Props {
  songs: SongOption[]
}

type Step = 'setup' | 'recording' | 'analyzing' | 'result'

// ── Componente ────────────────────────────────────────────────────────────────
export default function TomIdeal({ songs }: Props) {
  const [step, setStep] = useState<Step>('setup')

  // Setup state
  const [selectedSongId, setSelectedSongId] = useState<string>('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [manualKey, setManualKey] = useState('C')

  // Recording state
  const [micError, setMicError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [currentNote, setCurrentNote] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [midiSamples, setMidiSamples] = useState<number[]>([])

  // Result state
  const [analysis, setAnalysis] = useState('')

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const pitchBufRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const samplesRef = useRef<number[]>([])
  const elapsedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameCountRef = useRef(0)

  // Derived song info
  const selectedSong = songs.find(s => s.id === selectedSongId)
  const songTitle = selectedSong ? selectedSong.title : manualTitle
  const songArtist = selectedSong ? selectedSong.artist : manualArtist
  const originalKey = selectedSong ? selectedSong.original_key : manualKey

  const canRecord = songTitle.trim().length > 0

  // ── Gravação ────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setMicError(null)
    samplesRef.current = []
    elapsedRef.current = 0
    setMidiSamples([])
    setElapsed(0)
    setCurrentNote(null)
    frameCountRef.current = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      pitchBufRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>

      audioCtx.createMediaStreamSource(stream).connect(analyser)

      setIsRecording(true)

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1
        setElapsed(e => e + 1)
      }, 1000)

      const loop = () => {
        if (!analyserRef.current || !pitchBufRef.current || !audioCtxRef.current) return
        analyserRef.current.getFloatTimeDomainData(pitchBufRef.current)
        const freq = detectPitch(pitchBufRef.current, audioCtxRef.current.sampleRate)
        const midi = freq ? frequencyToMidi(freq) : null

        frameCountRef.current++

        if (midi !== null) {
          setCurrentNote(midiToName(midi))
          // Coleta 1 amostra a cada ~10 frames (≈ 160ms)
          if (frameCountRef.current % 10 === 0) {
            samplesRef.current.push(midi)
            setMidiSamples(prev => [...prev, midi])
          }
        } else if (frameCountRef.current % 10 === 0) {
          setCurrentNote(null)
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      setMicError(
        name === 'NotAllowedError'
          ? 'Permissão de microfone negada. Permita o acesso nas configurações do navegador.'
          : 'Não foi possível acessar o microfone.'
      )
    }
  }, [])

  const stopRecording = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    analyserRef.current = null
    audioCtxRef.current = null
    streamRef.current = null
    pitchBufRef.current = null
    setIsRecording(false)
  }, [])

  useEffect(() => () => { stopRecording() }, [stopRecording])

  // ── Análise ─────────────────────────────────────────────────────────────────
  async function analyzeVoice() {
    const samples = samplesRef.current
    if (samples.length < 5) return

    stopRecording()
    setStep('analyzing')
    setAnalysis('')

    const sorted = [...samples].sort((a, b) => a - b)
    const minMidi = sorted[Math.floor(sorted.length * 0.05)]
    const maxMidi = sorted[Math.floor(sorted.length * 0.95)]
    const medianMidi = sorted[Math.floor(sorted.length * 0.5)]

    try {
      const res = await fetch('/api/estudio/analisar-voz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle,
          songArtist,
          originalKey,
          minMidi,
          maxMidi,
          medianMidi,
          durationSeconds: elapsedRef.current,
        }),
      })

      if (!res.body) throw new Error('Sem resposta')

      setStep('result')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const { text } = JSON.parse(raw)
            if (text) setAnalysis(prev => prev + text)
          } catch { /* ignora chunks inválidos */ }
        }
      }
    } catch (err) {
      setStep('result')
      setAnalysis('Erro ao analisar. Verifique sua conexão e tente novamente.')
      console.error(err)
    }
  }

  function reset() {
    stopRecording()
    setStep('setup')
    setAnalysis('')
    setMidiSamples([])
    setElapsed(0)
    setCurrentNote(null)
  }

  // ── Render: setup ────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-1 font-semibold text-white">Selecione a música</h2>
          <p className="mb-4 text-sm text-gray-500">
            Escolha uma das suas cifras salvas ou preencha manualmente.
          </p>

          {songs.length > 0 && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Suas cifras salvas
              </label>
              <select
                value={selectedSongId}
                onChange={e => setSelectedSongId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">— Selecionar uma cifra —</option>
                {songs.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.artist} ({s.original_key})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!selectedSongId && (
            <div className="space-y-3">
              {songs.length > 0 && (
                <p className="text-center text-xs text-gray-600">ou preencha manualmente</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Título</label>
                  <input
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    placeholder="Ex: Evidências"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Artista</label>
                  <input
                    value={manualArtist}
                    onChange={e => setManualArtist(e.target.value)}
                    placeholder="Ex: Roberto Carlos"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Tom original da música</label>
                <select
                  value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
                    'Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm']
                    .map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          disabled={!canRecord}
          onClick={() => setStep('recording')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Mic2 className="h-4 w-4" /> Próximo — Cantar
        </button>
      </div>
    )
  }

  // ── Render: recording ────────────────────────────────────────────────────────
  if (step === 'recording') {
    const rangeMin = midiSamples.length > 0 ? Math.min(...midiSamples) : null
    const rangeMax = midiSamples.length > 0 ? Math.max(...midiSamples) : null
    const canAnalyze = elapsed >= 10 && midiSamples.length >= 10

    return (
      <div className="space-y-4">
        {/* Música selecionada */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          <Music2 className="h-5 w-5 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{songTitle}</p>
            <p className="truncate text-xs text-gray-500">{songArtist || '—'} · Tom {originalKey}</p>
          </div>
          <button onClick={reset} className="ml-auto shrink-0 text-xs text-gray-600 hover:text-gray-400">
            Trocar
          </button>
        </div>

        {/* Instrução */}
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          🎤 Cante qualquer trecho da música. Quanto mais você cantar (mínimo 10 segundos), mais precisa será a análise.
        </div>

        {/* Cards de status */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className={clsx(
              'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors',
              isRecording ? 'bg-emerald-500/20' : 'bg-gray-800'
            )}>
              {isRecording
                ? <Mic2 className="h-6 w-6 text-emerald-400" />
                : <MicOff className="h-6 w-6 text-gray-500" />}
            </div>
            <p className="text-xs font-medium text-gray-300">Microfone</p>
            <p className={clsx('mt-1 text-xs', isRecording ? 'text-emerald-400' : 'text-gray-600')}>
              {isRecording ? `${elapsed}s` : 'Inativo'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="mb-1 font-mono text-3xl font-bold text-indigo-400">
              {isRecording && currentNote ? currentNote : '—'}
            </div>
            <p className="text-xs font-medium text-gray-300">Nota detectada</p>
            <p className="mt-1 text-xs text-gray-600">
              {midiSamples.length} amostras coletadas
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="mb-1 font-mono text-lg font-bold text-white">
              {rangeMin && rangeMax
                ? `${midiToName(rangeMin)} – ${midiToName(rangeMax)}`
                : '—'}
            </div>
            <p className="text-xs font-medium text-gray-300">Alcance detectado</p>
            <p className="mt-1 text-xs text-gray-600">
              {rangeMin && rangeMax ? `${rangeMax - rangeMin} semitons` : 'aguardando...'}
            </p>
          </div>
        </div>

        {micError && (
          <p className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
            {micError}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-xl py-3 font-medium text-white transition-colors',
              isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            )}
          >
            {isRecording
              ? <><Square className="h-4 w-4" /> Pausar</>
              : <><Mic2 className="h-4 w-4" /> {midiSamples.length > 0 ? 'Continuar cantando' : 'Iniciar microfone'}</>}
          </button>

          <button
            disabled={!canAnalyze}
            onClick={analyzeVoice}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✨ Analisar meu tom
          </button>
        </div>

        {!canAnalyze && midiSamples.length > 0 && (
          <p className="text-center text-xs text-gray-600">
            Continue cantando por mais {Math.max(0, 10 - elapsed)}s para analisar...
          </p>
        )}
      </div>
    )
  }

  // ── Render: analyzing ────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="font-medium text-white">Analisando sua voz...</p>
        <p className="text-sm text-gray-500">O Professor IA está calculando o tom ideal para você</p>
      </div>
    )
  }

  // ── Render: result ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Análise Vocal — {songTitle}</h2>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Nova análise
        </button>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        {analysis ? (
          <AnalysisText text={analysis} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando análise...
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente para renderizar o texto com seções formatadas ──────────────
function AnalysisText({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-1 text-sm leading-relaxed text-gray-300">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="mt-4 first:mt-0 text-base font-semibold text-white">
              {line.replace('## ', '')}
            </h3>
          )
        }
        if (line.startsWith('- ') || line.match(/^\d+\./)) {
          return (
            <p key={i} className="ml-4 text-gray-300">
              {renderBold(line)}
            </p>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{renderBold(line)}</p>
      })}
    </div>
  )
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-white">{part}</strong>
      : part
  )
}
