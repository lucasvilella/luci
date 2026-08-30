/**
 * Cliente de API Unificado e Resiliente da Luci.
 * Conforme Milestone 0: Detecção automática de ambiente, timeout, offline graceful fallback e health-check.
 */

import { SystemStatus } from "./contracts/common"

const DEFAULT_NGROK_URL = "https://subdivide-clip-easiest.ngrok-free.dev"

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:8000"

  const storedServer = localStorage.getItem("luci.server_url")
  if (storedServer) {
    return storedServer.replace(/\/$/, "")
  }

  // Em desenvolvimento web local no PC (localhost:3000)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000"
  }

  // No Capacitor nativo Android ou PWA
  const isCapacitor = window.location.protocol === "capacitor:"
  if (isCapacitor) {
    return DEFAULT_NGROK_URL
  }

  return window.location.origin
}

export const API_BASE_URL = getApiBaseUrl()

export function setServerUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("luci.server_url", url.replace(/\/$/, ""))
  }
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("luci.api_token") || ""
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("luci.api_token", token)
  }
}

/**
 * Executa requisição HTTP autenticada com suporte a timeout e captura de falhas de rede.
 */
export async function luciApiFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(options.headers || {})

  headers.set("ngrok-skip-browser-warning", "1")
  if (!headers.has("X-User-Id")) {
    headers.set("X-User-Id", "lucas")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (!headers.has("Content-Type") && options.method && options.method !== "GET" && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`


  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })
    return response
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`[LuciAPI] Timeout de ${timeoutMs}ms ao acessar: ${url}`)
    } else {
      console.warn(`[LuciAPI] Falha de conexão ao acessar: ${url}`, error)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Checa a saúde e latência da conexão com o servidor Termux.
 */
export async function checkServerHealth(): Promise<SystemStatus> {
  const serverUrl = getApiBaseUrl()
  const start = Date.now()

  try {
    const res = await luciApiFetch("/api/v1/health", { method: "GET" }, 4000)
    const latencyMs = Date.now() - start
    const online = res.ok
    return {
      online,
      serverUrl,
      latencyMs,
      lastChecked: Date.now(),
    }
  } catch {
    return {
      online: false,
      serverUrl,
      latencyMs: undefined,
      lastChecked: Date.now(),
    }
  }
}
