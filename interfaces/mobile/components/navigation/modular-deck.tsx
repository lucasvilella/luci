"use client"

import React from "react"
import {
  Home,
  Compass,
  Library,
  User,
  Paperclip,
  MessageSquare,
  Bookmark,
  House,
  LayoutGrid,
  Cpu,
  Sparkles,
  Activity,
  Dumbbell,
  BarChart3,
  PieChart,
  Receipt,
  Target,
  CreditCard,
  Calendar,
  CheckSquare,
  Flame,
  FileText,
} from "lucide-react"
import {
  useAppNavigationStore,
  MODULES_REGISTRY,
  DeckItem,
} from "@/stores/useAppNavigationStore"
import { LuciCentralButton } from "./luci-central-button"

const DECK_ICONS_MAP: Record<string, React.ElementType> = {
  Home,
  Compass,
  Library,
  User,
  Paperclip,
  MessageSquare,
  Bookmark,
  House,
  LayoutGrid,
  Cpu,
  Sparkles,
  Activity,
  Dumbbell,
  BarChart3,
  PieChart,
  Receipt,
  Target,
  CreditCard,
  Calendar,
  CheckSquare,
  Flame,
  FileText,
}

export function ModularDeck() {
  const {
    activeModuleId,
    activeTabByModule,
    setActiveTab,
    setModuleSelectorOpen,
    isPushToTalkActive,
    setPushToTalkActive,
    openOrbScreen,
  } = useAppNavigationStore()

  const currentModule = MODULES_REGISTRY[activeModuleId] || MODULES_REGISTRY.music
  const currentTab = activeTabByModule[activeModuleId] || currentModule.defaultTab

  const renderDeckItem = (item: DeckItem) => {
    const Icon = DECK_ICONS_MAP[item.iconName] || Home
    const isActive = currentTab === item.id

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        aria-label={item.label}
        className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90 select-none touch-manipulation"
      >
        <div
          className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
            isActive
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Icon className="size-5 stroke-[1.8]" />
        </div>

        {/* Indicador Ativo (Ponto Lilás Elegante conforme o mock) */}
        <div className="h-1.5 flex items-center justify-center">
          {isActive && (
            <span className="size-1 rounded-full bg-[var(--accent-primary)] shadow-sm animate-fade-in" />
          )}
        </div>
      </button>
    )
  }

  return (
    <nav
      aria-label="Deck Modular da Luci"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 select-none"
    >
      {/* Contêiner Estilizado com Curvatura Orgânica e Calota Central */}
      <div
        className="pointer-events-auto relative flex h-[62px] w-full max-w-[420px] items-center justify-between px-3 shadow-2xl transition-all duration-300 backdrop-blur-2xl rounded-[32px]"
        style={{
          backgroundColor: "var(--bg-deck)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-deck)",
        }}
      >
        {/* Lado Esquerdo Simétrico */}
        <div className="flex flex-1 items-center justify-around">
          {currentModule.deckLeftItems.map(renderDeckItem)}
        </div>

        {/* Botão Central Ubíquo da Luci */}
        <LuciCentralButton
          onSingleTap={() => setModuleSelectorOpen(true)}
          onDoubleTap={openOrbScreen}
          onHoldStart={() => setPushToTalkActive(true)}
          onHoldEnd={() => setPushToTalkActive(false)}
          isHolding={isPushToTalkActive}
        />

        {/* Lado Direito Simétrico */}
        <div className="flex flex-1 items-center justify-around">
          {currentModule.deckRightItems.map(renderDeckItem)}
        </div>
      </div>
    </nav>
  )
}
