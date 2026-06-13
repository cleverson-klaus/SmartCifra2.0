import Link from 'next/link'
import { Music2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NavLinks from './NavLinks'
import UserMenu from './UserMenu'
import NavMobile from './NavMobile'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = (user?.user_metadata?.full_name as string | null) ?? null

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <Music2 className="h-6 w-6 text-indigo-400" />
          <span>Smart<span className="text-indigo-400">Cifra</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLinks />
          {user ? (
            <UserMenu name={name} email={user.email!} />
          ) : (
            <Link
              href="/auth/login"
              className="ml-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-indigo-500 hover:text-white"
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <NavMobile
          isLoggedIn={!!user}
          userName={name}
          userEmail={user?.email ?? null}
        />
      </div>
    </header>
  )
}
