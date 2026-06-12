import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { PROFESSOR_TOOLS, searchYouTube, type Exercise } from '@/lib/professor/tools'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é o Professor SmartCifra — um musicólogo e professor de teoria musical especializado em música popular brasileira: sertanejo, MPB, forró, pagode e bossa nova.

Seu conhecimento é baseado nos fundamentos de obras como:
- "Harmonia e Improvisação" (Almir Chediak) — referência da harmonia brasileira
- "Introdução à Teoria Musical" — escalas, intervalos, ritmos, compasso
- "Como Ouvir e Entender Música" — percepção musical, análise de obras
- Teoria funcional de acordes (tônica, subdominante, dominante)

COMO VOCÊ ENSINA:
1. Use linguagem clara e didática — do simples ao complexo
2. Sempre dê exemplos práticos com músicas brasileiras conhecidas
3. Quando explicar acordes, mostre a construção: "Am = A + C + E (fundamental + terça menor + quinta)"
4. Relacione teoria com prática: "por isso que G pede D — dominante resolvendo na tônica"
5. Varie as respostas — nunca repita a mesma explicação do mesmo jeito
6. Seja encorajador — teoria musical parece difícil mas é acessível

QUANDO USAR AS FERRAMENTAS:
- Use "buscar_videos" quando: o aluno pedir indicações, quando um conceito se beneficia de ver/ouvir, ou quando você quiser complementar a explicação com um exemplo visual
- Use "criar_exercicio" quando: acabar de explicar um conceito e quiser testar o entendimento, quando o aluno perguntar como praticar, ou quando o tópico for praticável interativamente

IMPORTANTE APÓS USAR FERRAMENTAS:
- Após chamar "buscar_videos": NUNCA repita os links ou títulos dos vídeos em texto. Os cards já são exibidos automaticamente. Apenas comente brevemente o que o aluno vai encontrar nos vídeos.
- Após chamar "criar_exercicio": NUNCA repita a pergunta ou opções em texto. O card interativo já é exibido. Apenas diga "Tente o exercício acima!" ou similar.

TÓPICOS QUE DOMINA:
- Escalas (maior, menor natural/harmônica/melódica, pentatônica)
- Intervalos (uníssono, segunda, terça, quarta, quinta, sexta, sétima, oitava)
- Construção de acordes (tríades, tétrades, extensões)
- Funções harmônicas (I, II, III, IV, V, VI, VII)
- Progressões do sertanejo/MPB: I-V-VI-IV, I-IV-V, I-VI-II-V
- Campo harmônico maior e menor
- Cadências (autêntica, plagal, suspensiva, deceptiva)
- Ritmo e compasso (binário, ternário, quaternário, 6/8)
- Cifras, transposição e capotraste
- Modulação e empréstimo modal

Quando o usuário mandar uma cifra específica (com acordes), analise:
- O campo harmônico (em que tom está)
- As funções de cada acorde
- Por que esses acordes soam bem juntos
- Sugestões de variações ou substituições

Responda sempre em português brasileiro.`

type OpenAIMessage = OpenAI.Chat.ChatCompletionMessageParam

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const { messages, songContext } = await request.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      songContext?: { title: string; artist: string; key: string; content: string }
    }

    const systemWithContext = songContext
      ? `${SYSTEM_PROMPT}\n\nCIFRA EM ANÁLISE:\nTítulo: ${songContext.title}\nArtista: ${songContext.artist}\nTom: ${songContext.key}\nConteúdo:\n${songContext.content}`
      : SYSTEM_PROMPT

    const readable = new ReadableStream({
      async start(controller) {
        const send = (obj: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

        try {
          // Histórico de mensagens para o modelo (pode crescer com tool calls)
          const history: OpenAIMessage[] = [
            { role: 'system', content: systemWithContext },
            ...messages,
          ]

          // Loop para suportar múltiplos tool calls em sequência
          for (let round = 0; round < 3; round++) {
            const stream = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              stream: true,
              tools: PROFESSOR_TOOLS as unknown as OpenAI.Chat.ChatCompletionTool[],
              tool_choice: 'auto',
              messages: history,
            })

            let textBuffer = ''
            const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {}
            let finishReason: string | null = null

            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta
              finishReason = chunk.choices[0]?.finish_reason ?? finishReason

              // Texto normal → enviar ao cliente
              if (delta?.content) {
                textBuffer += delta.content
                send({ text: delta.content })
              }

              // Tool call em streaming → acumular chunks
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (!toolCallBuffers[tc.index]) {
                    toolCallBuffers[tc.index] = { id: '', name: '', args: '' }
                  }
                  if (tc.id) toolCallBuffers[tc.index].id = tc.id
                  if (tc.function?.name) toolCallBuffers[tc.index].name += tc.function.name
                  if (tc.function?.arguments) toolCallBuffers[tc.index].args += tc.function.arguments
                }
              }
            }

            // Se não houve tool calls, terminamos
            if (finishReason !== 'tool_calls') break

            // Processar cada tool call
            const toolCalls = Object.values(toolCallBuffers)
            const assistantMsg: OpenAIMessage = {
              role: 'assistant',
              content: textBuffer,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.args },
              })),
            }
            history.push(assistantMsg)

            for (const tc of toolCalls) {
              let toolResult = ''

              if (tc.name === 'buscar_videos') {
                const args = JSON.parse(tc.args) as { query: string; contexto: string }
                const videos = await searchYouTube(args.query)
                send({ videos, contexto: args.contexto })
                toolResult = JSON.stringify(videos)
              }

              if (tc.name === 'criar_exercicio') {
                const exercise = JSON.parse(tc.args) as Exercise
                send({ exercise })
                toolResult = 'Exercício criado e exibido ao aluno.'
              }

              history.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: toolResult,
              })
            }
            // Continua o loop para obter a resposta final do modelo
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro interno.'
          send({ error: msg })
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.'
    return Response.json({ error: message }, { status: 500 })
  }
}
