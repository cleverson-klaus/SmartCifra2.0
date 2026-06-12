import { NextRequest, NextResponse } from 'next/server'
import {
  extractYoutubeId,
  fetchYoutubeMetadata,
  transcribeYoutube,
  transcribeAudioWithTimestamps,
} from '@/lib/ai/transcribe'
import { generateChordSheet } from '@/lib/ai/chord-sheet'
import { detectChordsFromService, alignChordsToLyrics } from '@/lib/ai/chord-align'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada. Adicione sua chave no .env.local.' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const url = formData.get('url') as string | null
    const file = formData.get('file') as File | null

    let title: string | undefined
    let artist: string | undefined

    // ---------------------------------------------------------------
    // Fonte 1: YouTube URL → legenda + GPT
    // ---------------------------------------------------------------
    if (url) {
      const videoId = extractYoutubeId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'URL do YouTube inválida.' }, { status: 400 })
      }

      const meta = await fetchYoutubeMetadata(videoId)
      if (meta) { title = meta.title; artist = meta.author }

      const lyrics = await transcribeYoutube(videoId)
      if (!lyrics.trim()) {
        return NextResponse.json(
          { error: 'Não foi possível extrair letra deste conteúdo.' },
          { status: 422 }
        )
      }

      const result = await generateChordSheet({ lyrics, title, artist })
      return NextResponse.json(result)
    }

    // ---------------------------------------------------------------
    // Fonte 2: Upload de áudio
    // ---------------------------------------------------------------
    if (file) {
      // Roda detecção Python + transcrição Whisper em paralelo
      const [chordData, transcription] = await Promise.all([
        detectChordsFromService(file),
        transcribeAudioWithTimestamps(file),
      ])

      // Caminho A: serviço Python disponível → cifra com acordes reais
      // Rejeita resultado se os acordes são cromáticos em sequência (sinal de áudio sem harmonia)
      const isChromaticArtifact = (chords: {chord: string}[]) => {
        if (chords.length < 4) return false
        const roots = chords.map(c => c.chord.replace('m',''))
        const chromatic = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
        let consecutive = 0
        for (let i = 1; i < roots.length; i++) {
          const prev = chromatic.indexOf(roots[i-1])
          const curr = chromatic.indexOf(roots[i])
          if (curr === (prev + 1) % 12) consecutive++
        }
        return consecutive >= roots.length * 0.6
      }
      if (chordData && transcription.words.length > 0 && chordData.chords.length > 0
          && !isChromaticArtifact(chordData.chords)) {
        const content = alignChordsToLyrics(transcription.words, chordData.chords)
        return NextResponse.json({
          title: title ?? 'Música',
          artist: artist ?? 'Artista',
          key: chordData.key,
          bpm: chordData.bpm,
          content,
        })
      }

      // Caminho B: Python indisponível → fallback para GPT
      const lyrics = transcription.text || transcription.words.map((w) => w.word).join(' ')
      if (!lyrics.trim()) {
        return NextResponse.json(
          { error: 'Não foi possível extrair letra deste conteúdo.' },
          { status: 422 }
        )
      }

      const result = await generateChordSheet({ lyrics, title, artist })
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Envie um link do YouTube ou um arquivo de áudio.' },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.'
    console.error('[/api/generate]', message)

    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json(
        { error: 'Cota da OpenAI esgotada. Adicione créditos em platform.openai.com/billing.' },
        { status: 429 }
      )
    }
    if (message.includes('401') || message.includes('Incorrect API key')) {
      return NextResponse.json(
        { error: 'Chave da OpenAI inválida. Verifique o OPENAI_API_KEY no .env.local.' },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
