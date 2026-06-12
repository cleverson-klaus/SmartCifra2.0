"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Mic2, Zap, GraduationCap } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/cifras", label: "Cifras", icon: Music2 },
  { href: "/gerador", label: "Gerador", icon: Zap },
  { href: "/estudio", label: "Estúdio", icon: Mic2 },
  { href: "/professor", label: "Professor", icon: GraduationCap },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
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
  );
}
