import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface GeneratedChordSheet {
  title: string
  artist: string
  key: string
  bpm: number
  content: string
}

// Nomes de acordes válidos — usados para validação pós-geração
const VALID_CHORD_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const VALID_CHORD_REGEX =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M)?(\d+)?(\/[A-G][#b]?)?$/

function isValidChord(s: string): boolean {
  if (!VALID_CHORD_ROOTS.includes(s[0])) return false
  return VALID_CHORD_REGEX.test(s)
}

// Remove colchetes que contêm palavras inválidas como acorde (ex: [mim], [você])
function sanitizeContent(content: string): string {
  return content.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const trimmed = inner.trim()
    if (isValidChord(trimmed)) return match
    // Falso acorde — retorna só o texto sem colchetes
    return trimmed
  })
}

// Limpa transcrição bruta do YouTube antes de enviar ao GPT
export function cleanTranscript(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.trim())
    // Remove timestamps como "[00:32]" que às vezes vêm na transcrição
    .map((line) => line.replace(/^\[\d{1,2}:\d{2}\]\s*/, ''))
    .filter(Boolean)
    .join('\n')
}

const SYSTEM_PROMPT = `Você é um especialista em cifras musicais no estilo CifraClub.

TAREFA: Converter a letra bruta de uma música em uma cifra formatada.

REGRAS DE FORMATO — SIGA RIGOROSAMENTE:

1. FRASES CURTAS: quebre a letra em frases de no máximo 5 a 7 palavras, uma por linha.
   Cada linha de letra deve corresponder a uma frase musical natural (como você cantaria).

2. POSIÇÃO DO ACORDE: coloque o acorde entre colchetes imediatamente antes da sílaba onde ele soa.
   O acorde muda no início de cada linha OU no meio, exatamente na sílaba correta.

3. EXEMPLO CORRETO — frases curtas, acorde no ponto certo:
[G]Se quer saber de mim
[Em]Pergunte para mim
[Am]Se for falar do que passou
[D]Conta a parte que você errou

[G]Não pergunto se estou bem
[Em]Não quero ser assunto seu
[Am]Não estrague as minhas canções
[D]Vá pro inferno com suas recordações

4. EXEMPLO ERRADO — linha longa com múltiplos acordes (NÃO FAÇA):
[G]se quer saber de mim Pergunte para mim [Em]não pergunto se estou bem [C]não quero [D]ser assunto [G]seu

5. Separe seções com linha em branco e cabeçalhos: Verso 1, Pré-Refrão, Refrão, Ponte.

ACORDES VÁLIDOS: C D E F G A B com sufixos: m, 7, maj7, m7, 6, 9, sus2, sus4, dim, aug, add9, /baixo.
PROIBIDO: palavras em português como acordes. NUNCA: [mim], [você], [não], [de], [que], etc.

Responda APENAS com JSON válido sem markdown:
{
  "title": "título",
  "artist": "artista",
  "key": "tom (ex: G, Em, C)",
  "bpm": 120,
  "content": "cifra completa"
}`

export async function generateChordSheet(params: {
  lyrics: string
  title?: string
  artist?: string
}): Promise<GeneratedChordSheet> {
  const { lyrics, title, artist } = params

  const userMessage = [
    title && `Título: ${title}`,
    artist && `Artista: ${artist}`,
    `\nLetra:\n${cleanTranscript(lyrics)}`,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2, // mais determinístico para seguir as regras
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  })

  const raw = response.choices[0].message.content
  if (!raw) throw new Error('Resposta vazia do modelo.')

  const parsed = JSON.parse(raw) as GeneratedChordSheet

  if (!parsed.content || !parsed.title) {
    throw new Error('Resposta do modelo incompleta.')
  }

  return {
    title: parsed.title ?? title ?? 'Título desconhecido',
    artist: parsed.artist ?? artist ?? 'Artista desconhecido',
    key: parsed.key ?? 'C',
    bpm: Number(parsed.bpm) || 120,
    content: sanitizeContent(parsed.content), // remove falsos acordes
  }
}
