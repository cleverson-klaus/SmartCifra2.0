import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[midi % 12]}${octave}`
}

export async function POST(req: NextRequest) {
  const {
    songTitle,
    songArtist,
    originalKey,
    minMidi,
    maxMidi,
    medianMidi,
    durationSeconds,
  } = (await req.json()) as {
    songTitle: string
    songArtist: string
    originalKey: string
    minMidi: number
    maxMidi: number
    medianMidi: number
    durationSeconds: number
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('OPENAI_API_KEY não configurada.', { status: 503 })
  }

  const lowNote = midiToName(minMidi)
  const highNote = midiToName(maxMidi)
  const centerNote = midiToName(medianMidi)
  const rangeSemitones = maxMidi - minMidi

  const prompt = `Você é um professor de canto experiente, inspirado nos grandes métodos de canto brasileiro e bel canto. Um aluno cantou trechos de uma música e o sistema mediu seu alcance vocal em tempo real.

Dados do aluno:
- Música escolhida: "${songTitle}" — ${songArtist || 'artista não informado'}
- Tom original da música: ${originalKey}
- Nota mais grave detectada: ${lowNote}
- Nota mais aguda detectada: ${highNote}
- Nota central (mediana): ${centerNote}
- Amplitude total: ${rangeSemitones} semitons
- Tempo cantando: ${Math.round(durationSeconds)} segundos

Responda em português brasileiro de forma estruturada, prática e muito encorajadora. Use exatamente esses títulos de seção:

## 🎤 Sua Classificação Vocal
Com base no alcance (${lowNote} a ${highNote}), classifique o tipo de voz (soprano, mezzo-soprano, contralto, tenor, barítono, baixo-barítono, baixo). Explique brevemente o que isso significa para o aluno.

## 🎵 Tom Ideal para Esta Música
Diga claramente qual é o melhor tom para o aluno cantar "${songTitle}". Informe quantos semitons subir (+) ou descer (−) do tom original (${originalKey}) e por quê. Exemplo de resposta: "Recomendo cantar em Sol Maior (G), 2 semitons abaixo do original (${originalKey}). Isso coloca a música bem no centro da sua voz."

## 💪 Exercícios para Aquecer
Sugira 3 exercícios vocais práticos e específicos para preparar a voz para cantar esta música. Para cada um, descreva como executar e por quanto tempo.

## ✨ Como Impactar com Sua Voz
Dê 3 dicas concretas de como cantar "${songTitle}" de forma bonita, afinada e emocionante — técnica de respiração, dinâmica, expressão. Seja específico para o estilo desta música.`

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          stream: true,
        })

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) send({ text })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro interno'
        send({ text: `\n\nErro: ${msg}` })
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
