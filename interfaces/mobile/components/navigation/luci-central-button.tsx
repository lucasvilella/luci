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
          <div className="size-6 flex items-center justify-center transition-transform duration-200">
            <svg
              viewBox="0 0 176.05 254.34"
              className="w-full h-full text-white fill-current drop-shadow-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.64,104.72c-2.6,6.99-5.26,13.95-5.93,21.44-.24,2.65-.48,5.32-.35,7.97.89,18.23,10.79,28.12,29.01,28.97,15.7.74,30.24-3.88,44.54-9.68,3.27-1.33,2.61-3.82,2.67-6.22.74-30.16.05-60.31,0-90.47-.01-8.06,1.13-15.94,3.74-23.58,5.47-16.01,15.52-27.48,32.38-31.79,23-5.87,43.76,7.54,49.42,31.76,3.85,16.48,1.96,32.71-4.35,48.06-18.22,44.3-49.49,74.81-96.2,88.14-11.99,3.42-24.3,4.41-36.61,1.93C8.55,167.14-.91,154.79.07,134.02c.51-10.84,4.23-20.54,10.57-29.3ZM105.08,136.85c2.46-.14,3.51-1.55,4.75-2.55,17.53-14.07,31.38-31.14,41.05-51.46,6.62-13.91,9.96-28.54,8.26-44.06-1.47-13.34-6.89-24.3-19.2-30.8-11.95-6.32-23.27-2.55-29.28,9.5-2.55,5.12-3.83,10.61-4.66,16.24-1.36,9.27-.96,18.59-.94,27.9.06,24.96.02,49.92.02,75.22Z" />
              <path d="M176.01,225.88c0,8.5-.07,15.61.04,22.71.04,2.37-1.44,2.71-3.14,2.96-16.69,2.48-33.49,4.16-50.23,1.27-26.32-4.55-41.98-23.6-42.08-50.27-.03-8.83.01-17.66-.04-26.49-.01-1.92-.03-3.56,2.23-4.41,7.45-2.82,14.49-6.55,22.29-11.03,0,2.69-.04,4.59,0,6.48.43,15.97-1.1,31.99,1.01,47.91.97,7.32,3.07,14.32,6.66,20.81,8.56,15.47,25,19.73,40.07,10.39,6-3.72,10.89-8.75,15.97-13.54,2.04-1.93,4.09-3.86,7.21-6.8Z" />
              <path d="M21.92,86.99c6.54-9.19,8.87-18.06.67-27.83,10.1,6.75,18.81,4.42,27.38-3-5.81,9.14-8.42,18.07-.25,27.57-10.54-7.1-19.3-3.96-27.79,3.26Z" />
            </svg>
          </div>
        )}
      </button>
    </div>
  )
}
