'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MusicalKey } from '@/types/database'

export interface SaveSongState {
  error?: string
}

export async function saveSong(
  _prev: SaveSongState,
  formData: FormData
): Promise<SaveSongState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado para salvar uma cifra.' }
  }

  const title = (formData.get('title') as string).trim()
  const artist = (formData.get('artist') as string).trim()
  const key = formData.get('key') as MusicalKey
  const bpm = Number(formData.get('bpm'))
  const genre = (formData.get('genre') as string | null) || null
  const content = (formData.get('content') as string).trim()
  const youtubeUrl = (formData.get('youtube_url') as string | null) ?? undefined

  if (!title || !artist || !content) {
    return { error: 'Título, artista e cifra são obrigatórios.' }
  }

  const { data: song, error: songError } = await supabase
    .from('songs')
    .insert({
      user_id: user.id,
      title,
      artist,
      original_key: key || 'C',
      bpm: bpm || null,
      genre,
      youtube_url: youtubeUrl || null,
      is_public: true,
    })
    .select('id')
    .single()

  if (songError || !song) {
    return { error: 'Erro ao salvar a música. Tente novamente.' }
  }

  if (content) {
    await supabase.from('chords').insert({
      song_id: song.id,
      content,
      version: 1,
      is_active: true,
    })
  }

  revalidatePath('/cifras')
  redirect(`/cifras/${song.id}`)
}

export async function deleteSong(songId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  // RLS garante que só o dono pode deletar, mas validamos aqui também
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId)
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao deletar a música.' }

  revalidatePath('/minhas-cifras')
  revalidatePath('/cifras')
  return {}
}
