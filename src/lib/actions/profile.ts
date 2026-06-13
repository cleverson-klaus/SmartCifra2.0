'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ProfileState {
  error?: string
  success?: string
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const full_name = (formData.get('full_name') as string).trim()
  const username = (formData.get('username') as string).trim().toLowerCase()

  if (!full_name) return { error: 'O nome não pode estar vazio.' }

  if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: 'Username deve ter 3-30 caracteres: letras, números e _.' }
  }

  // Verifica se username já está em uso por outro usuário
  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) return { error: 'Este username já está em uso.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, username: username || null })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
  return { success: 'Perfil atualizado com sucesso!' }
}
