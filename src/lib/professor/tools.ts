export interface YouTubeVideo {
  id: string
  title: string
  channel: string
  thumbnail: string
  url: string
}

export interface Exercise {
  tipo: 'multipla_escolha' | 'identificar_acorde' | 'completar_sequencia'
  topico: string
  dificuldade: 'iniciante' | 'intermediario' | 'avancado'
  pergunta: string
  opcoes: string[]
  resposta_correta: string
  explicacao: string
  dica?: string
}

// Definição das ferramentas para o OpenAI function calling
export const PROFESSOR_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'buscar_videos',
      description:
        'Busca vídeos educativos no YouTube sobre teoria musical quando o aluno precisa de uma explicação visual ou audiovisual do conceito discutido.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Termos de busca em português, ex: "campo harmônico maior explicação", "como fazer acorde de sétima violão"',
          },
          contexto: {
            type: 'string',
            description: 'Frase curta explicando por que está sugerindo esses vídeos (ex: "Para visualizar melhor o conceito de cadência")',
          },
        },
        required: ['query', 'contexto'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'criar_exercicio',
      description:
        'Cria um exercício interativo para o aluno praticar o conceito que acabou de aprender. Use isso para consolidar o aprendizado com prática.',
      parameters: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['multipla_escolha', 'identificar_acorde', 'completar_sequencia'],
            description: 'Tipo do exercício',
          },
          topico: { type: 'string', description: 'Tópico do exercício' },
          dificuldade: {
            type: 'string',
            enum: ['iniciante', 'intermediario', 'avancado'],
          },
          pergunta: { type: 'string', description: 'Enunciado claro do exercício' },
          opcoes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Opções de resposta (3 ou 4 opções)',
            minItems: 3,
            maxItems: 4,
          },
          resposta_correta: {
            type: 'string',
            description: 'A opção correta — deve ser idêntica a um dos valores em "opcoes"',
          },
          explicacao: {
            type: 'string',
            description: 'Explicação detalhada da resposta, mostrada após o aluno responder',
          },
          dica: {
            type: 'string',
            description: 'Dica opcional exibida se o aluno errar',
          },
        },
        required: ['tipo', 'topico', 'dificuldade', 'pergunta', 'opcoes', 'resposta_correta', 'explicacao'],
      },
    },
  },
] as const

// Executa a busca no YouTube
export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    // Sem API key: retorna link de busca para o usuário abrir manualmente
    return [
      {
        id: '',
        title: `Pesquisar "${query}" no YouTube`,
        channel: 'Abrir busca no YouTube',
        thumbnail: '',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      },
    ]
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '3',
      key: apiKey,
      relevanceLanguage: 'pt',
      regionCode: 'BR',
      videoCategoryId: '10', // Música
    })

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
    if (!res.ok) return []

    const data = await res.json() as {
      items: Array<{
        id: { videoId: string }
        snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } } }
      }>
    }

    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))
  } catch {
    return []
  }
}
