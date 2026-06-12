"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Music2 } from "lucide-react";
import type { AuthState } from "@/lib/actions/auth";

interface Props {
  mode: "login" | "register";
  action: (prev: AuthState, data: FormData) => Promise<AuthState>;
}

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(action, {});

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-2xl font-bold text-white">
            <Music2 className="h-7 w-7 text-indigo-400" />
            Smart<span className="text-indigo-400">Cifra</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-300">
            {isLogin ? "Entrar na sua conta" : "Criar conta gratuita"}
          </h1>
        </div>

        <form action={formAction} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Nome completo
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Seu nome"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-400">
              {state.error}
            </p>
          )}

          {state.success && (
            <p className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-400">
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? (
            <>
              Não tem conta?{" "}
              <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">
                Cadastre-se grátis
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                Entrar
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
