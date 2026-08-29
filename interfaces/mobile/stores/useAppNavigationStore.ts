import { create } from "zustand"

export type AppModuleId = "orb" | "music" | "cinema" | "home" | "fitness" | "finance" | "tasks"

export interface DeckItem {
  id: string
  label: string
  iconName: string
}

export interface ModuleConfig {
  id: AppModuleId
  name: string
  description: string
  iconName: string
  deckLeftItems: DeckItem[]
  deckRightItems: DeckItem[]
  defaultTab: string
}

export const MODULES_REGISTRY: Record<AppModuleId, ModuleConfig> = {
  orb: {
    id: "orb",
    name: "Luci Assistant",
    description: "IA conversacional e multimodal com Orb de voz",
    iconName: "Sparkles",
    deckLeftItems: [
      { id: "attach", label: "Anexar", iconName: "Paperclip" },
    ],
    deckRightItems: [
      { id: "chat", label: "Chat", iconName: "MessageSquare" },
    ],
    defaultTab: "chat",
  },
  music: {
    id: "music",
    name: "LuciMusic",
    description: "Player inteligente de música com rádio contínua",
    iconName: "Music",
    deckLeftItems: [
      { id: "home", label: "Início", iconName: "Home" },
      { id: "search", label: "Buscar", iconName: "Compass" },
    ],
    deckRightItems: [
      { id: "library", label: "Biblioteca", iconName: "Library" },
      { id: "profile", label: "Perfil", iconName: "User" },
    ],
    defaultTab: "home",
  },
  cinema: {
    id: "cinema",
    name: "Cinema & Séries",
    description: "Streaming e catálogo inteligente de filmes e séries",
    iconName: "Film",
    deckLeftItems: [
      { id: "home", label: "Início", iconName: "Home" },
      { id: "search", label: "Buscar", iconName: "Compass" },
    ],
    deckRightItems: [
      { id: "favorites", label: "Favoritos", iconName: "Bookmark" },
      { id: "profile", label: "Perfil", iconName: "User" },
    ],
    defaultTab: "home",
  },
  home: {
    id: "home",
    name: "Casa Inteligente",
    description: "Automação residencial, iluminação e sensores IoT",
    iconName: "House",
    deckLeftItems: [
      { id: "home", label: "Início", iconName: "Home" },
      { id: "rooms", label: "Ambientes", iconName: "LayoutGrid" },
    ],
    deckRightItems: [
      { id: "devices", label: "Dispositivos", iconName: "Cpu" },
      { id: "scenes", label: "Cenas", iconName: "Sparkles" },
    ],
    defaultTab: "home",
  },
  fitness: {
    id: "fitness",
    name: "Treino & Saúde",
    description: "Planos de exercícios, evolução física e biofeedback",
    iconName: "Dumbbell",
    deckLeftItems: [
      { id: "routines", label: "Rotinas", iconName: "Activity" },
      { id: "exercises", label: "Exercícios", iconName: "Dumbbell" },
    ],
    deckRightItems: [
      { id: "stats", label: "Estatísticas", iconName: "BarChart3" },
      { id: "profile", label: "Perfil", iconName: "User" },
    ],
    defaultTab: "routines",
  },
  finance: {
    id: "finance",
    name: "Finanças",
    description: "Gestão financeira pessoal e orçamentos preditivos",
    iconName: "Wallet",
    deckLeftItems: [
      { id: "overview", label: "Visão Geral", iconName: "PieChart" },
      { id: "transactions", label: "Extrato", iconName: "Receipt" },
    ],
    deckRightItems: [
      { id: "budgets", label: "Metas", iconName: "Target" },
      { id: "cards", label: "Cartões", iconName: "CreditCard" },
    ],
    defaultTab: "overview",
  },
  tasks: {
    id: "tasks",
    name: "Agenda & Tarefas",
    description: "Cronograma inteligente, lembretes e objetivos diários",
    iconName: "Calendar",
    deckLeftItems: [
      { id: "calendar", label: "Agenda", iconName: "Calendar" },
      { id: "tasks", label: "Tarefas", iconName: "CheckSquare" },
    ],
    deckRightItems: [
      { id: "habits", label: "Hábitos", iconName: "Flame" },
      { id: "notes", label: "Notas", iconName: "FileText" },
    ],
    defaultTab: "calendar",
  },
}

interface AppNavigationState {
  activeModuleId: AppModuleId
  activeTabByModule: Record<AppModuleId, string>
  isModuleSelectorOpen: boolean
  isPushToTalkActive: boolean
  pushToTalkTranscript: string | null

  // Ações
  setActiveModule: (moduleId: AppModuleId) => void
  setActiveTab: (tabId: string) => void
  setModuleSelectorOpen: (open: boolean) => void
  setPushToTalkActive: (active: boolean) => void
  setPushToTalkTranscript: (text: string | null) => void
  openOrbScreen: () => void
}

export const useAppNavigationStore = create<AppNavigationState>((set, get) => ({
  activeModuleId: "music",
  activeTabByModule: {
    orb: "chat",
    music: "home",
    cinema: "home",
    home: "home",
    fitness: "routines",
    finance: "overview",
    tasks: "calendar",
  },
  isModuleSelectorOpen: false,
  isPushToTalkActive: false,
  pushToTalkTranscript: null,

  setActiveModule: (moduleId) => {
    set({
      activeModuleId: moduleId,
      isModuleSelectorOpen: false,
    })
  },

  setActiveTab: (tabId) => {
    const { activeModuleId, activeTabByModule } = get()
    set({
      activeTabByModule: {
        ...activeTabByModule,
        [activeModuleId]: tabId,
      },
    })
  },

  setModuleSelectorOpen: (open) => set({ isModuleSelectorOpen: open }),
  setPushToTalkActive: (active) => set({ isPushToTalkActive: active }),
  setPushToTalkTranscript: (text) => set({ pushToTalkTranscript: text }),

  openOrbScreen: () => {
    set({
      activeModuleId: "orb",
      isModuleSelectorOpen: false,
      activeTabByModule: {
        ...get().activeTabByModule,
        orb: "chat",
      },
    })
  },
}))
