/**
 * AppActionDispatcher — Executor e Despachante Global de Ações do SuperApp da Luci.
 * Conforme docs/99_RULES/NON_NEGOTIABLES.md:
 * - Atua em todo o sistema (Omnipresente).
 * - Interpreta comandos vindos do Backend (REST, WebSocket, Push-to-Talk ou Voice Orb).
 * - Realiza transições imediatas de módulo, execução musical, alternância de temas e controle de dispositivos.
 */

import { useAppNavigationStore, AppModuleId } from "@/stores/useAppNavigationStore"
import { type LuciTrack } from "@/lib/lucimusic"

export interface IntentPayload {
  type: "COMMAND" | "REASONING"
  action?: string | null
  query_param?: string | null
  confidence?: number
}

export interface AppActionEvent {
  action: string
  payload?: any
}

class AppActionDispatcher {
  private static instance: AppActionDispatcher | null = null
  private playTrackCallback: ((track: LuciTrack, queue?: LuciTrack[]) => void) | null = null
  private pauseTrackCallback: (() => void) | null = null
  private nextTrackCallback: (() => void) | null = null
  private toggleLikeCallback: (() => void) | null = null

  public static getInstance(): AppActionDispatcher {
    if (!AppActionDispatcher.instance) {
      AppActionDispatcher.instance = new AppActionDispatcher()
    }
    return AppActionDispatcher.instance
  }

  /**
   * Registra os controles do player de música ativo para execução global.
   */
  public registerPlayerControls(controls: {
    playTrack: (track: LuciTrack, queue?: LuciTrack[]) => void
    pauseTrack: () => void
    nextTrack: () => void
    toggleLike: () => void
  }) {
    this.playTrackCallback = controls.playTrack
    this.pauseTrackCallback = controls.pauseTrack
    this.nextTrackCallback = controls.nextTrack
    this.toggleLikeCallback = controls.toggleLike
  }

  /**
   * Executa uma intenção classificada pelo Cérebro da Luci diretamente no App.
   */
  public async dispatchIntent(intent?: IntentPayload | null, userMessage?: string): Promise<boolean> {
    if (!intent || intent.type !== "COMMAND" || !intent.action) return false

    const action = intent.action
    const query = intent.query_param || userMessage || ""
    console.log(`[AppActionDispatcher] Despachando ação global: ${action} (param: ${query})`)

    // 1. Navegação de Módulos e Abas
    if (action === "app.navigate" || action.startsWith("navigate.")) {
      const targetModule = this.resolveModuleId(query)
      if (targetModule) {
        useAppNavigationStore.getState().setActiveModule(targetModule)
        return true
      }
    }

    // 2. Comandos de Música (Tocar / Play)
    if (action === "music.play" && query) {
      // Garante que o app está no módulo de música
      useAppNavigationStore.getState().setActiveModule("music")
      
      try {
        const { searchMusicCatalog } = await import("@/lib/lucimusic")
        const results = await searchMusicCatalog(query)
        if (results.songs && results.songs.length > 0) {
          const song = results.songs[0]
          if (this.playTrackCallback) {
            this.playTrackCallback(song, results.songs)
          }
          return true
        }
      } catch (err) {
        console.warn("[AppActionDispatcher] Falha ao tocar música via comando:", err)
      }
    }

    // 3. Comandos de Controle de Player
    if (action === "music.pause") {
      if (this.pauseTrackCallback) this.pauseTrackCallback()
      return true
    }

    if (action === "music.next") {
      if (this.nextTrackCallback) this.nextTrackCallback()
      return true
    }

    if (action === "music.like") {
      if (this.toggleLikeCallback) this.toggleLikeCallback()
      return true
    }

    return false
  }

  /**
   * Resolve o ID canônico do módulo do SuperApp a partir de termos em linguagem natural.
   */
  public resolveModuleId(target: string): AppModuleId | null {
    const clean = target.toLowerCase().trim()
    if (clean.includes("music") || clean.includes("música") || clean.includes("musica") || clean.includes("player")) {
      return "music"
    }
    if (clean.includes("automação") || clean.includes("automacao") || clean.includes("casa") || clean.includes("home") || clean.includes("dispositivos")) {
      return "home"
    }
    if (clean.includes("chat") || clean.includes("conversa") || clean.includes("chatting")) {
      return "orb"
    }
    if (clean.includes("cinema") || clean.includes("filme") || clean.includes("série") || clean.includes("serie")) {
      return "cinema"
    }
    if (clean.includes("treino") || clean.includes("fitness") || clean.includes("saúde") || clean.includes("saude") || clean.includes("academia")) {
      return "fitness"
    }
    if (clean.includes("finança") || clean.includes("financas") || clean.includes("dinheiro") || clean.includes("carteira")) {
      return "finance"
    }
    if (clean.includes("tarefa") || clean.includes("agenda") || clean.includes("calendário") || clean.includes("habito")) {
      return "tasks"
    }
    if (clean.includes("orb") || clean.includes("assistente") || clean.includes("voz") || clean.includes("principal")) {
      return "orb"
    }
    return null
  }
}

export const appActionDispatcher = AppActionDispatcher.getInstance()
