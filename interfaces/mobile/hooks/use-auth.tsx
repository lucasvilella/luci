"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type User = {
  name: string
  username: string
  email: string
}

type StoredUser = User & { password: string }

type AuthResult = { ok: true } | { ok: false; error: string }

type AuthContextValue = {
  user: User | null
  mounted: boolean
  login: (identifier: string, password: string) => AuthResult
  signup: (data: { name: string; username: string; email: string; password: string }) => AuthResult
  logout: () => void
}

// Usuário de teste fixado no código (sem banco de dados nesta fase).
const SEED_USER: StoredUser = {
  name: "Lucas Vilella",
  username: "lucasmvilella",
  email: "lv.lucasvilella@gmail.com",
  password: "123456789",
}

const USERS_KEY = "nova.users"
const SESSION_KEY = "nova.session"

const AuthContext = createContext<AuthContextValue | null>(null)

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [SEED_USER]
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    const parsed: StoredUser[] = raw ? JSON.parse(raw) : []
    // garante que o usuário de teste sempre exista
    const hasSeed = parsed.some((u) => u.username === SEED_USER.username)
    return hasSeed ? parsed : [SEED_USER, ...parsed]
  } catch {
    return [SEED_USER]
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(SEED_USER)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      if (raw) {
        setUser(JSON.parse(raw))
      } else {
        setUser(SEED_USER)
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(SEED_USER))
      }
    } catch {
      setUser(SEED_USER)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    function persistSession(u: User | null) {
      if (u) window.localStorage.setItem(SESSION_KEY, JSON.stringify(u))
      else window.localStorage.removeItem(SESSION_KEY)
      setUser(u)
    }

    return {
      user,
      mounted,
      login(identifier, password) {
        const id = identifier.trim().toLowerCase()
        if (!id || !password) return { ok: false, error: "Preencha todos os campos." }
        const found = readUsers().find(
          (u) => u.username.toLowerCase() === id || u.email.toLowerCase() === id,
        )
        if (!found) return { ok: false, error: "Usuário não encontrado." }
        if (found.password !== password) return { ok: false, error: "Senha incorreta." }
        persistSession({ name: found.name, username: found.username, email: found.email })
        return { ok: true }
      },
      signup({ name, username, email, password }) {
        const cleanName = name.trim()
        const cleanUser = username.trim().toLowerCase()
        const cleanEmail = email.trim().toLowerCase()
        if (!cleanName || !cleanUser || !cleanEmail || !password) {
          return { ok: false, error: "Preencha todos os campos." }
        }
        if (password.length < 6) return { ok: false, error: "A senha deve ter ao menos 6 caracteres." }
        const users = readUsers()
        if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
          return { ok: false, error: "Este username já está em uso." }
        }
        if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
          return { ok: false, error: "Este e-mail já está cadastrado." }
        }
        const next: StoredUser = { name: cleanName, username: cleanUser, email: cleanEmail, password }
        writeUsers([...users, next])
        persistSession({ name: next.name, username: next.username, email: next.email })
        return { ok: true }
      },
      logout() {
        persistSession(null)
      },
    }
  }, [user, mounted])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
