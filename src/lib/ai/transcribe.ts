import OpenAI from 'openai'
import { YoutubeTranscript } from 'youtube-transcript'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Extrai o ID do vídeo de qualquer formato de URL do YouTube
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Tenta buscar título/artista a partir do oEmbed público do YouTube (sem API key)
export async function fetchYoutubeMetadata(
  videoId: string
): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (!res.ok) return null
    const data = await res.json()
    return { title: data.title ?? '', author: data.author_name ?? '' }
  } catch {
    return null
  }
}

// Busca transcrição/legenda do YouTube (legendas automáticas ou manuais)
export async function transcribeYoutube(videoId: string): Promise<string> {
  // Tenta português primeiro, depois inglês, depois qualquer idioma
  const langs = ['pt', 'pt-BR', 'en', '']
  let segments: { text: string }[] = []

  for (const lang of langs) {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined)
      if (segments.length > 0) break
    } catch {
      continue
    }
  }

  if (segments.length === 0) {
    throw new Error('Este vídeo não possui legendas automáticas disponíveis. Tente fazer upload do MP3.')
  }

  // Junta segmentos e quebra em linhas por pausas longas (offset gap > 1.5s)
  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] as { text: string; offset?: number; duration?: number }
    const text = seg.text.trim().replace(/\n/g, ' ')
    if (!text) continue

    currentLine += (currentLine ? ' ' : '') + text

    // Quebra de linha quando há pausa significativa entre segmentos
    const next = segments[i + 1] as typeof seg | undefined
    const thisEnd = (seg.offset ?? 0) + (seg.duration ?? 0)
    const gap = next ? (next.offset ?? 0) - thisEnd : 9999

    if (gap > 1200 || currentLine.length > 80) {
      lines.push(currentLine)
      currentLine = ''
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines.join('\n')
}

// Transcreve áudio com Whisper (limite: 25 MB)
export async function transcribeAudio(file: File): Promise<string> {
  const MAX_BYTES = 25 * 1024 * 1024

  if (file.size > MAX_BYTES) {
    throw new Error('Arquivo muito grande para o Whisper. Limite: 25 MB.')
  }

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text',
  })

  return transcription as unknown as string
}

export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface TimestampedTranscription {
  text: string
  words: WordTimestamp[]
}

// Transcreve áudio com Whisper retornando timestamps por palavra (para alinhar com acordes)
export async function transcribeAudioWithTimestamps(file: File): Promise<TimestampedTranscription> {
  const MAX_BYTES = 25 * 1024 * 1024

  if (file.size > MAX_BYTES) {
    throw new Error('Arquivo muito grande para o Whisper. Limite: 25 MB.')
  }

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  }) as unknown as {
    text: string
    words?: WordTimestamp[]
    segments?: { start: number; end: number; text: string }[]
  }

  const words: WordTimestamp[] = transcription.words ?? []

  // Fallback: se o Whisper não retornou palavras, estima posições pelos segmentos
  if (words.length === 0 && transcription.segments) {
    for (const seg of transcription.segments) {
      const segWords = seg.text.trim().split(/\s+/)
      const duration = seg.end - seg.start
      const wDuration = duration / segWords.length
      segWords.forEach((w, i) => {
        words.push({
          word: w,
          start: seg.start + i * wDuration,
          end: seg.start + (i + 1) * wDuration,
        })
      })
    }
  }

  return { text: transcription.text, words }
}
