'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, BookOpen, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import ExerciseCard from '@/components/ExerciseCard'
import VideoCard from '@/components/VideoCard'
import type { Exercise, YouTubeVideo } from '@/lib/professor/tools'

// Tipos de mensagem
interface TextBlock { type: 'text'; content: string }
interface VideosBlock { type: 'videos'; videos: YouTubeVideo[]; contexto: string }
interface ExerciseBlock { type: 'exercise'; exercise: Exercise }
type Block = TextBlock | VideosBlock | ExerciseBlock

interface Message {
  role: 'user' | 'assistant'
  content: string   // usado para enviar ao histórico da API
  blocks: Block[]   // usado para renderização
}

interface SongContext {
  title: string
  artist: string
  key: string
  content: string
}

interface ProfessorChatProps {
  songContext?: SongContext
  initialQuestion?: string
}

const SUGGESTED_TOPICS = [
  'O que é campo harmônico?',
  'Como construir um acorde menor?',
  'Por que G e D combinam tanto?',
  'O que é a progressão I-V-VI-IV?',
  'Como funciona o capotraste?',
  'O que é uma cadência?',
  'Diferença entre maior e menor',
  'O que é acorde de sétima?',
]

export default function ProfessorChat({ songContext, initialQuestion }: ProfessorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: Message = {
      role: 'user',
      content: text.trim(),
      blocks: [{ type: 'text', content: text.trim() }],
    }

    // Histórico no formato que a API espera (só role + content)
    const apiHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: 'assistant', content: '', blocks: [{ type: 'text', content: '' }] },
    ])
    setInput('')
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory, songContext }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao conectar com o professor.')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data) as Record<string, unknown>

            if (event.text) {
              // Texto do professor — acumula no último bloco de texto
              const chunk = event.text as string
              setMessages((prev) => {
                const updated = [...prev]
                const last = { ...updated[updated.length - 1] }
                const blocks = [...last.blocks]
                const lastBlock = blocks[blocks.length - 1]

                if (lastBlock?.type === 'text') {
                  blocks[blocks.length - 1] = { type: 'text', content: lastBlock.content + chunk }
                } else {
                  blocks.push({ type: 'text', content: chunk })
                }

                last.blocks = blocks
                last.content += chunk
                updated[updated.length - 1] = last
                return updated
              })
            }

            if (event.videos) {
              // Bloco de vídeos
              setMessages((prev) => {
                const updated = [...prev]
                const last = { ...updated[updated.length - 1] }
                last.blocks = [
                  ...last.blocks,
                  {
                    type: 'videos' as const,
                    videos: event.videos as YouTubeVideo[],
                    contexto: (event.contexto as string) ?? '',
                  },
                ]
                updated[updated.length - 1] = last
                return updated
              })
            }

            if (event.exercise) {
              // Bloco de exercício
              setMessages((prev) => {
                const updated = [...prev]
                const last = { ...updated[updated.length - 1] }
                last.blocks = [
                  ...last.blocks,
                  { type: 'exercise' as const, exercise: event.exercise as Exercise },
                ]
                updated[updated.length - 1] = last
                return updated
              })
            }

            if (event.error) {
              throw new Error(event.error as string)
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
      setMessages((prev) => {
        const updated = [...prev]
        const last = { ...updated[updated.length - 1] }
        last.blocks = [{ type: 'text', content: `⚠️ ${msg}` }]
        updated[updated.length - 1] = last
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, songContext])

  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      sendMessage(initialQuestion)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setIsStreaming(false)
  }

  const hasMessages = messages.length > 0
  const lastMsg = messages[messages.length - 1]
  const isWaiting =
    isStreaming && lastMsg?.role === 'assistant' && lastMsg.blocks.every(
      (b) => b.type === 'text' && b.content === ''
    )

  return (
    <div className="flex h-full flex-col">
      {/* Header contextual */}
      {songContext && (
        <div className="flex items-center gap-3 border-b border-indigo-900/40 bg-indigo-950/30 px-5 py-3">
          <BookOpen className="h-4 w-4 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-indigo-300">Analisando cifra</p>
            <p className="truncate text-sm text-white">
              {songContext.title}
              <span className="ml-1 text-gray-400">— Tom: {songContext.key}</span>
            </p>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {!hasMessages && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20">
                <BookOpen className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Professor de Música</h3>
              <p className="mt-1 text-sm text-gray-400">
                Especialista em teoria musical, harmonia e cifras brasileiras.{' '}
                {songContext
                  ? 'Pergunte sobre os acordes desta música.'
                  : 'Posso explicar conceitos, sugerir vídeos e criar exercícios práticos.'}
              </p>
            </div>

            {!songContext && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sugestões de tópicos
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => sendMessage(topic)}
                      className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:border-indigo-600/50 hover:bg-indigo-950/30 hover:text-white"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {songContext && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Perguntas sobre esta cifra
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    `Por que os acordes de "${songContext.title}" funcionam juntos?`,
                    `Qual é o campo harmônico do tom ${songContext.key}?`,
                    'Crie um exercício para eu praticar esta progressão',
                    'Mostre vídeos que me ajudem a entender esses acordes',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:border-indigo-600/50 hover:bg-indigo-950/30 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-sm">
                🎵
              </div>
            )}

            <div className={clsx('max-w-[85%] space-y-3', msg.role === 'user' && 'flex flex-col items-end')}>
              {msg.blocks.map((block, bi) => {
                if (block.type === 'text') {
                  if (!block.content && isStreaming && i === messages.length - 1) {
                    return (
                      <div key={bi} className="rounded-2xl bg-gray-800 px-4 py-3">
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce text-gray-400" style={{ animationDelay: '0ms' }}>•</span>
                          <span className="animate-bounce text-gray-400" style={{ animationDelay: '150ms' }}>•</span>
                          <span className="animate-bounce text-gray-400" style={{ animationDelay: '300ms' }}>•</span>
                        </span>
                      </div>
                    )
                  }
                  if (!block.content) return null
                  return (
                    <div
                      key={bi}
                      className={clsx(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      )}
                    >
                      {block.content}
                      {isStreaming && i === messages.length - 1 && bi === msg.blocks.length - 1 && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-indigo-400 align-middle" />
                      )}
                    </div>
                  )
                }

                if (block.type === 'videos') {
                  return <VideoCard key={bi} videos={block.videos} contexto={block.contexto} />
                }

                if (block.type === 'exercise') {
                  return <ExerciseCard key={bi} exercise={block.exercise} />
                }

                return null
              })}
            </div>

            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Indicador de "professor pensando" antes da primeira resposta */}
        {isWaiting && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Professor pensando…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-5 py-4">
        {hasMessages && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            >
              <RotateCcw className="h-3 w-3" /> Nova conversa
            </button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre teoria musical…"
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-600">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
