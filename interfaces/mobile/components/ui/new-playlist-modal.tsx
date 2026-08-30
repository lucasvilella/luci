"use client"

import React, { useState } from "react"
import { Eye, ChevronDown, Lock, Globe } from "lucide-react"

interface NewPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (playlistData: {
    title: string
    description: string
    isPublic: boolean
  }) => void
}

export function NewPlaylistModal({
  isOpen,
  onClose,
  onCreate,
}: NewPlaylistModalProps) {
  const [title, setTitle] = useState("Músicas Mais Populares")
  const [description, setDescription] = useState("Lançamentos e Atualizações Recentes")
  const [isPublic, setIsPublic] = useState(true)
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      description: description.trim(),
      isPublic,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none animate-fade-in">
      {/* Backdrop com desfoque suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Card Flutuante Inferior (Bottom Sheet no Padrão Exato do Mockup) */}
      <div
        className="relative z-10 w-full max-w-[480px] rounded-t-[36px] p-6 shadow-2xl border-t transition-all duration-300 animate-slide-up"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Pílula / Handle Superior */}
        <div className="flex justify-center mb-3">
          <span className="h-1.5 w-10 rounded-full bg-[var(--text-muted)]/40" />
        </div>

        {/* Título Centralizado */}
        <h3 className="text-lg font-black text-center text-[var(--text-primary)] mb-5 tracking-tight">
          Nova Playlist
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Input 1: Nome da Playlist */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da playlist"
              className="w-full h-14 px-4 rounded-[20px] bg-[var(--bg-surface-1)] text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all shadow-inner"
            />
          </div>

          {/* Input 2: Descrição */}
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da playlist (opcional)"
              className="w-full h-14 px-4 rounded-[20px] bg-[var(--bg-surface-1)] text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all shadow-inner"
            />
          </div>

          {/* Dropdown de Visibilidade (Público / Privado) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
              className="w-full h-14 px-4 rounded-[20px] bg-[var(--bg-surface-1)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                {isPublic ? (
                  <Globe className="size-4 text-[var(--accent-primary)]" />
                ) : (
                  <Lock className="size-4 text-amber-500" />
                )}
                <span>{isPublic ? "Público" : "Privado (Apenas Você)"}</span>
              </div>
              <ChevronDown className="size-4 text-[var(--text-secondary)]" />
            </button>

            {isVisibilityOpen && (
              <div className="absolute top-16 inset-x-0 z-20 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-xl p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublic(true)
                    setIsVisibilityOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                >
                  <Globe className="size-4 text-[var(--accent-primary)]" />
                  <span>Público</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublic(false)
                    setIsVisibilityOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                >
                  <Lock className="size-4 text-amber-500" />
                  <span>Privado</span>
                </button>
              </div>
            )}
          </div>

          {/* Divisor sutil */}
          <div className="h-[1px] bg-[var(--border-subtle)] my-2" />

          {/* ─── BOTÕES DE AÇÃO INFERIORES (CANCELAR / CRIAR NA COR DA MARCA) ─── */}
          <div className="flex items-center gap-3 pt-1">
            {/* Botão Cancelar */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-13 rounded-full bg-[var(--bg-surface-1)] text-[var(--accent-primary)] font-bold text-sm border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)] active:scale-95 transition-all"
            >
              Cancelar
            </button>

            {/* Botão Criar na Cor da Marca Luci */}
            <button
              type="submit"
              className="flex-1 h-13 rounded-full bg-[var(--accent-primary)] text-white font-extrabold text-sm shadow-lg shadow-[#5c62ec]/35 hover:opacity-90 active:scale-95 transition-all"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
