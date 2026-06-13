"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User, ChevronDown, Library } from "lucide-react";
import { logout } from "@/lib/actions/auth";

interface Props {
  name: string | null;
  email: string;
}

export default function UserMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {initials}
        </div>
        <span className="hidden max-w-[120px] truncate sm:block">{name ?? email}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-xl">
          <div className="border-b border-gray-800 px-4 py-2.5">
            <p className="text-sm font-medium text-white truncate">{name ?? "Usuário"}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>
          <Link
            href="/minhas-cifras"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <Library className="h-4 w-4" /> Minhas Cifras
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" /> Meu perfil
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
