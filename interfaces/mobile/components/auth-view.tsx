"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Sparkles, Eye, EyeOff, User, Mail, Lock, AtSign, AlertCircle } from "lucide-react"

type Mode = "login" | "signup"

export function AuthView() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [identifier, setIdentifier] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result =
      mode === "login"
        ? login(identifier, password)
        : signup({ name, username, email, password })
    if (!result.ok) setError(result.error)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPassword("")
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pb-6 pt-4 animate-view-in">
      {/* brand */}
      <div className="flex flex-col items-center gap-3 pb-8 pt-6">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_40px_-10px_var(--primary)]">
          <Sparkles className="size-8" aria-hidden="true" />
        </span>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre para conversar com a Nova"
              : "Cadastre-se para começar a usar a Nova"}
          </p>
        </div>
      </div>

      {/* mode switch */}
      <div className="mb-6 flex rounded-full border border-border bg-card p-1">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "login" ? "Entrar" : "Cadastrar"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <>
            <Field icon={User} label="Nome">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <Field icon={AtSign} label="Username">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <Field icon={Mail} label="E-mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </Field>
          </>
        )}

        {mode === "login" && (
          <Field icon={User} label="E-mail ou username">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e-mail ou username"
              autoComplete="username"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </Field>
        )}

        <Field icon={Lock} label="Senha">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-transform active:scale-[0.98]"
        >
          {mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      {mode === "login" && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Conta de teste</p>
          <p className="mt-1">
            username: <span className="font-mono text-foreground">lucasmvilella</span>
          </p>
          <p>
            senha: <span className="font-mono text-foreground">123456789</span>
          </p>
        </div>
      )}
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="pl-1 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {children}
      </span>
    </label>
  )
}
