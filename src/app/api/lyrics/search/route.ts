import { NextRequest, NextResponse } from 'next/server'

export interface LyricsResult {
  title: string
  artist: string
  lyrics: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const art = searchParams.get('art')?.trim()
  const mus = searchParams.get('mus')?.trim()

  if (!art || !mus) {
    return NextResponse.json({ error: 'Informe artista e música.' }, { status: 400 })
  }

  const encoded = (s: string) => encodeURIComponent(s)

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encoded(art)}/${encoded(mus)}`,
      {
        headers: { 'User-Agent': 'SmartCifra/1.0' },
        next: { revalidate: 3600 },
      }
    )

    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Música não encontrada. Tente variar o nome do artista ou da música.' },
        { status: 404 }
      )
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao buscar a letra.' }, { status: 502 })
    }

    const data = await res.json()

    if (!data.lyrics) {
      return NextResponse.json({ error: 'Letra não disponível para esta música.' }, { status: 404 })
    }

    const result: LyricsResult = {
      title: mus,
      artist: art,
      lyrics: (data.lyrics as string).trim(),
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erro de conexão. Tente novamente.' }, { status: 502 })
  }
}
