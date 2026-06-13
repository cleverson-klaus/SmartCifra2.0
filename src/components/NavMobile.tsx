'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Music2, Zap, Mic2, GraduationCap,
  Library, User, LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { logout } from '@/lib/actions/auth'

const navLinks = [
  { href: '/cifras',    label: 'Cifras',    icon: Music2 },
  { href: '/gerador',   label: 'Gerador',   icon: Zap },
  { href: '/estudio',   label: 'Estúdio',   icon: Mic2 },
  { href: '/professor', label: 'Professor', icon: GraduationCap },
]

interface Props {
  isLoggedIn: boolean
  userName: string | null
  userEmail: string | null
}

export default function NavMobile({ isLoggedIn, userName, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Fecha ao mudar de página
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const initials = userName
    ? userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:border-gray-500 hover:text-white md:hidden"
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div className="fixed inset-0 top-[57px] z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Painel */}
          <div className="relative flex h-full max-h-[calc(100vh-57px)] w-full flex-col overflow-y-auto border-t border-gray-800 bg-gray-950 pb-8">
            {/* Nav links */}
            <nav className="p-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
                Navegar
              </p>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mx-4 border-t border-gray-800" />

            {/* Conta */}
            <div className="p-4">
              {isLoggedIn ? (
                <>
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Minha conta
                  </p>
                  {/* Avatar + nome */}
                  <div className="mb-2 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{userName ?? 'Usuário'}</p>
                      <p className="truncate text-xs text-gray-500">{userEmail}</p>
                    </div>
                  </div>

                  <Link href="/minhas-cifras"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                    <Library className="h-5 w-5" /> Minhas Cifras
                  </Link>
                  <Link href="/perfil"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                    <User className="h-5 w-5" /> Meu Perfil
                  </Link>
                  <form action={logout}>
                    <button type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-colors hover:bg-gray-800">
                      <LogOut className="h-5 w-5" /> Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  Entrar na conta
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
