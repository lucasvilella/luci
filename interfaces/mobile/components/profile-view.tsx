"use client"

import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { AtSign, Mail, LogOut, Bell, Shield, ChevronRight, Sparkles, Menu, Moon, Sun } from "lucide-react"
import type { LucideIcon } from "lucide-react"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ProfileView({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  if (!user) return null

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pb-6 pt-4 animate-view-in bg-background text-foreground no-scrollbar select-none">
      <div className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir Menu"
          className="size-10 flex items-center justify-center rounded-full bg-secondary border border-border shadow-sm text-foreground active:scale-95 transition-all"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-base font-extrabold tracking-tight text-foreground uppercase">Configurações</h1>
        <div className="size-10" />
      </div>

      {/* avatar card */}
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground shadow-lg shadow-primary/20">
          {initials(user.name)}
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Luci Pro
        </span>
      </div>

      {/* account info */}
      <p className="px-1 pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Informações da conta
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <InfoRow icon={AtSign} label="Username" value={user.username} />
        <div className="mx-4 h-px bg-border/60" />
        <InfoRow icon={Mail} label="E-mail" value={user.email} />
      </div>

      {/* settings */}
      <p className="px-1 pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Aparência e Preferências
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Toggle Theme Row */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground">
              {mounted && theme === "dark" ? (
                <Moon className="size-4 text-indigo-400" />
              ) : (
                <Sun className="size-4 text-amber-500" />
              )}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Tema do Sistema</p>
              <p className="text-sm font-bold text-foreground capitalize">
                {mounted ? (theme === "dark" ? "Modo Escuro" : "Modo Claro") : "Claro"}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-secondary">
            Alternar
          </span>
        </button>
        <div className="mx-4 h-px bg-border/60" />
        <SettingRow icon={Bell} label="Notificações" />
        <div className="mx-4 h-px bg-border/60" />
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
