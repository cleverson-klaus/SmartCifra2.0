'use client'

import { useActionState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import type { ProfileState } from '@/lib/actions/profile'

interface Props {
  fullName: string | null
  username: string | null
  email: string
  songCount: number
  initials: string
}

const initial: ProfileState = {}

export default function ProfileForm({ fullName, username, email, songCount, initials }: Props) {
  const [state, action, pending] = useActionState(updateProfile, initial)

  return (
    <form action={action} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-white">{fullName ?? 'Sem nome'}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <p className="mt-1 text-xs text-gray-600">{songCount} cifra{songCount !== 1 ? 's' : ''} salva{songCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Feedback */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Campos */}
      <div className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-300">
            Nome completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={fullName ?? ''}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-300">
            Username <span className="text-gray-600">(opcional)</span>
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-700 bg-gray-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <span className="pl-4 text-sm text-gray-500">@</span>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={username ?? ''}
              placeholder="meu_usuario"
              className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">3-30 caracteres: letras, números e _</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">E-mail</label>
          <input
            type="text"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-600">O e-mail não pode ser alterado aqui.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar alterações
      </button>
    </form>
  )
}
