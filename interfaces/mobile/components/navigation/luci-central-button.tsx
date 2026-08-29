"use client"

import React, { useRef, useState, useCallback } from "react"
import { Plus, Sparkles, Mic } from "lucide-react"

interface LuciCentralButtonProps {
  onSingleTap: () => void
  onDoubleTap: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
  isHolding: boolean
}

export function LuciCentralButton({
  onSingleTap,
  onDoubleTap,
  onHoldStart,
  onHoldEnd,
  isHolding,
}: LuciCentralButtonProps) {
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  const HOLD_DURATION_MS = 650

  const cancelHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setProgress(0)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    startTimeRef.current = Date.now()

    // Inicia a animação de preenchimento radial suave do anel externo
    const start = Date.now()
    const updateProgress = () => {
      const elapsed = Date.now() - start
      const nextProgress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
      setProgress(nextProgress)

      if (elapsed < HOLD_DURATION_MS) {
        animationFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }
    animationFrameRef.current = requestAnimationFrame(updateProgress)

    // Aciona o Push-to-Talk após threshold atingido
    timerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35)
        } catch {}
      }
      onHoldStart()
    }, HOLD_DURATION_MS)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    const elapsed = Date.now() - startTimeRef.current
    cancelHold()

    if (isHolding) {
      onHoldEnd()
      return
    }

    // Se soltou antes de completar o hold, avalia cliques rápidos (1 ou 2 taps)
    if (elapsed < HOLD_DURATION_MS) {
      clickCountRef.current += 1

      if (clickCountRef.current === 1) {
        singleTapTimeoutRef.current = setTimeout(() => {
          if (clickCountRef.current === 1) {
            onSingleTap()
          }
          clickCountRef.current = 0
        }, 280)
      } else if (clickCountRef.current === 2) {
        if (singleTapTimeoutRef.current) {
          clearTimeout(singleTapTimeoutRef.current)
          singleTapTimeoutRef.current = null
        }
        clickCountRef.current = 0
        onDoubleTap()
      }
    }
  }

  const handlePointerLeave = () => {
    if (isHolding) {
      onHoldEnd()
    }
    cancelHold()
  }

  // Cálculos do anel circular SVG de progresso
  const radius = 27
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex items-center justify-center -top-3 z-30">
      {/* Anel Radial de Progresso SVG no Hold */}
      <svg
        className="absolute pointer-events-none -rotate-90 size-16"
        viewBox="0 0 64 64"
      >
        {/* Trilho com pontinhos/glow sutil */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="rgba(124, 130, 255, 0.15)"
          strokeWidth="2"
          strokeDasharray="2 3"
        />
        {/* Anel de Preenchimento Dinâmico */}
        {progress > 0 && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="url(#radialGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: progress === 0 ? "stroke-dashoffset 0.15s ease-out" : "none",
            }}
          />
        )}
        <defs>
          <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c62ec" />
            <stop offset="50%" stopColor="#7c82ff" />
            <stop offset="100%" stopColor="#ffccf2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Botão Físico Virtual da Luci com Calota Elevada */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={cancelHold}
        aria-label="Botão Central Luci"
        className={`relative flex size-[50px] items-center justify-center rounded-full transition-all duration-200 select-none touch-none ${
          isHolding
            ? "scale-110 shadow-lg shadow-[#5c62ec]/60 ring-2 ring-[#7c82ff]"
            : "active:scale-95 shadow-md shadow-[#5c62ec]/35"
        }`}
        style={{
          background: isHolding
            ? "linear-gradient(135deg, #494ec9 0%, #686eff 100%)"
            : "linear-gradient(135deg, #5c62ec 0%, #7c82ff 100%)",
        }}
      >
        {isHolding ? (
          <Mic className="size-6 text-white animate-pulse" />
        ) : (
          <Plus className="size-6 text-white transition-transform duration-200" />
        )}
      </button>
    </div>
  )
}
