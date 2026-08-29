/**
 * Contratos Universais da Luci — Tipagens de Comunicação e Estado do Sistema.
 * Base para comunicação resiliente e tipada entre Frontend e Backend.
 */

export interface SystemStatus {
  online: boolean
  serverUrl: string
  latencyMs?: number
  version?: string
  lastChecked: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export type SuperAppModule = "music" | "films" | "luci" | "home-assistant" | "profile"
