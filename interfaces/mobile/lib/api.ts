/**
 * Configuração de API da Luci.
 * Detecta automaticamente o URL do backend baseado na origem da página.
 * Em produção (servido pelo FastAPI), o backend está no mesmo host.
 */

function getApiBaseUrl(): string {
  if (typeof window === "undefined") return ""
  
  // Se estiver rodando dentro do Capacitor WebView (capacitor://localhost ou http://localhost)
  const isCapacitor = window.location.protocol === "capacitor:" || window.location.hostname === "localhost"
  const storedServer = localStorage.getItem("luci.server_url")
  if (storedServer) {
    return storedServer.replace(/\/$/, "")
  }

  if (isCapacitor) {
    // Endereço IP atual do host ou fallback para porta padrão 8000
    return "http://192.168.15.69:8000"
  }

  // Quando servido pelo FastAPI na web, o backend está na mesma origem
  return window.location.origin
}

export const API_BASE_URL = getApiBaseUrl()

export function setServerUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("luci.server_url", url)
  }
}

// Token de autenticação (armazenado no localStorage após login)
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
 * Fetch autenticado para o backend FastAPI da Luci.
 */
export async function luciApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (!headers.has("Content-Type") && options.method !== "GET") {
    headers.set("Content-Type", "application/json")
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
}
