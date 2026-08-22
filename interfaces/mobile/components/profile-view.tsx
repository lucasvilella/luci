"use client"

import { useAuth } from "@/hooks/use-auth"
import { AtSign, Mail, LogOut, Bell, Shield, ChevronRight, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ProfileView() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pb-6 pt-2 animate-view-in">
      <div className="flex items-center pb-4 pt-2">
        <h1 className="text-lg font-semibold text-foreground">Perfil</h1>
      </div>

      {/* avatar card */}
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground shadow-[0_12px_40px_-12px_var(--primary)]">
          {initials(user.name)}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Plano Pro
        </span>
      </div>

      {/* account info */}
      <p className="px-1 pb-2 pt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Informações da conta
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <InfoRow icon={AtSign} label="Username" value={user.username} />
        <div className="mx-4 h-px bg-border" />
        <InfoRow icon={Mail} label="E-mail" value={user.email} />
      </div>

      {/* settings */}
      <p className="px-1 pb-2 pt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preferências
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SettingRow icon={Bell} label="Notificações" />
        <div className="mx-4 h-px bg-border" />
        <SettingRow icon={Shield} label="Privacidade e segurança" />
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-6 flex items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sair da conta
      </button>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SettingRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent">
      <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
