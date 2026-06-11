"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Mic2, Zap } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/cifras", label: "Cifras", icon: Music2 },
  { href: "/gerador", label: "Gerador", icon: Zap },
  { href: "/estudio", label: "Estúdio", icon: Mic2 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Music2 className="h-6 w-6 text-indigo-400" />
          <span>
            Smart<span className="text-indigo-400">Cifra</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
