import type { WordTimestamp } from './transcribe'

export interface DetectedChord {
  chord: string
  time: number
}

export interface ChordServiceResult {
  bpm: number
  key: string
  chords: DetectedChord[]
}

/**
 * Chama o serviço Python de detecção de acordes.
 * Retorna null se o serviço não estiver configurado ou disponível.
 */
export async function detectChordsFromService(file: File): Promise<ChordServiceResult | null> {
  const serviceUrl = process.env.CHORD_SERVICE_URL
  if (!serviceUrl) return null

  try {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${serviceUrl}/detect`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000), // 2 min para músicas longas
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' })) as { detail?: string }
      console.warn('[chord-service]', err.detail)
      return null
    }

    return await res.json() as ChordServiceResult
  } catch (err) {
    console.warn('[chord-service] indisponível:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Combina acordes detectados (com timestamps) + palavras transcritas (com timestamps)
 * e produz uma cifra no formato SmartCifra: [G]palavra [Em]outra
 *
 * Algoritmo:
 *  - Para cada palavra, encontra qual acorde estava ativo naquele momento
 *  - Insere [Acorde] quando o acorde muda
 *  - Quebra linhas por silêncio (gap > 0.8s) ou comprimento (> 55 chars)
 */
export function alignChordsToLyrics(
  words: WordTimestamp[],
  chords: DetectedChord[]
): string {
  if (words.length === 0) return ''
  if (chords.length === 0) return words.map((w) => w.word).join(' ')

  const lines: string[] = []
  let currentLine = ''
  let lastChord: string | null = null

  for (let i = 0; i < words.length; i++) {
    const w = words[i]

    // Acorde ativo = último acorde que começou antes (ou no mesmo momento) desta palavra
    const active = chords.filter((c) => c.time <= w.start + 0.05).at(-1)
    const chord = active?.chord ?? null

    // Insere marcador de acorde quando muda
    if (chord && chord !== lastChord) {
      currentLine += `[${chord}]`
      lastChord = chord
    }

    currentLine += w.word

    const nextWord = words[i + 1]
    const gap = nextWord ? nextWord.start - w.end : 999

    // Adiciona espaço ou quebra de linha
    if (gap > 0.8 || currentLine.length > 55) {
      lines.push(currentLine.trim())
      currentLine = ''
      lastChord = null // força reemissão do acorde no início da próxima linha
    } else {
      currentLine += ' '
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim())

  return lines.join('\n')
}
