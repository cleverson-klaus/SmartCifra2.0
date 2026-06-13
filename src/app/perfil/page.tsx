import { redirect } from 'next/navigation'
import { ArrowLeft, Library } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/ProfileForm'
import type { Profile } from '@/types/database'

export const metadata = { title: 'Meu Perfil — SmartCifra' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar')

  const [profileResult, songsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('songs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const profile = profileResult.data as Profile | null
  const songCount = songsResult.count ?? 0

  const name = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null
  const username = profile?.username ?? null
  const email = user.email ?? ''

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : email[0].toUpperCase()

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais.</p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <ProfileForm
          fullName={name}
          username={username}
          email={email}
          songCount={songCount}
          initials={initials}
        />
      </div>

      {/* Atalho para cifras */}
      <Link
        href="/minhas-cifras"
        className="mt-4 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-5 py-4 transition-colors hover:border-gray-700 hover:bg-gray-900"
      >
        <Library className="h-5 w-5 text-indigo-400" />
        <div>
          <p className="text-sm font-medium text-white">Minhas Cifras</p>
          <p className="text-xs text-gray-500">{songCount} cifra{songCount !== 1 ? 's' : ''} salva{songCount !== 1 ? 's' : ''}</p>
        </div>
      </Link>
    </div>
  )
}
