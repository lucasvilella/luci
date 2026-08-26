"use client"

import { useEffect, useState, useRef } from "react"
import { extractPaletteFromImage, DEFAULT_PALETTE, type TrackColorPalette } from "@/lib/palette-extractor"

interface DynamicBackgroundProps {
  imageUrl?: string
  intensity?: "normal" | "subtle" | "vibrant"
  overlayOpacity?: number
  className?: string
  children?: React.ReactNode
}

/**
 * DynamicBackground — Apple Music Fluid Dynamic Mesh Gradient
 * 
 * Componente que renderiza massas de cores orgânicas com desfoque pesado (blur: 70-100px)
 * e aceleração por GPU (translate3d/will-change), com crossfade suave de 1.2s entre faixas.
 */
export function DynamicBackground({
  imageUrl,
  intensity = "normal",
  overlayOpacity = 0.45,
  className = "",
  children,
}: DynamicBackgroundProps) {
  // Mantemos duas camadas para transição suave de crossfade (A e B)
  const [currentPalette, setCurrentPalette] = useState<TrackColorPalette>(DEFAULT_PALETTE)
  const [prevPalette, setPrevPalette] = useState<TrackColorPalette | null>(null)
  const [isCrossfading, setIsCrossfading] = useState(false)
  const lastImageRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!imageUrl || imageUrl === lastImageRef.current) return
    lastImageRef.current = imageUrl

    let isMounted = true

    extractPaletteFromImage(imageUrl).then((newPalette) => {
      if (!isMounted) return

      setPrevPalette(currentPalette)
      setCurrentPalette(newPalette)
      setIsCrossfading(true)

      const timer = setTimeout(() => {
        if (isMounted) {
          setIsCrossfading(false)
          setPrevPalette(null)
        }
      }, 1200) // 1.2s crossfade

      return () => clearTimeout(timer)
    })

    return () => {
      isMounted = false
    }
  }, [imageUrl, currentPalette])

  const renderMeshLayer = (palette: TrackColorPalette, opacity: number, transitionClass: string) => {
    return (
      <div
        className={`absolute inset-0 size-full pointer-events-none overflow-hidden select-none ${transitionClass}`}
        style={{
          opacity,
          backgroundColor: palette.darkBackground,
          transition: "opacity 1.2s ease-in-out",
        }}
      >
        {/* Orbe 1: Primário (Top-Left / Centro) */}
        <div
          className="absolute -top-[20%] -left-[15%] w-[120vw] h-[120vw] max-w-[650px] max-h-[650px] rounded-full animate-mesh-1 mix-blend-screen filter blur-[85px] sm:blur-[110px]"
          style={{
            background: `radial-gradient(circle, ${palette.primary} 0%, rgba(0,0,0,0) 70%)`,
            opacity: intensity === "vibrant" ? 0.9 : 0.75,
            transform: "translate3d(0,0,0)",
          }}
        />

        {/* Orbe 2: Secundário (Bottom-Right) */}
        <div
          className="absolute -bottom-[20%] -right-[15%] w-[130vw] h-[130vw] max-w-[700px] max-h-[700px] rounded-full animate-mesh-2 mix-blend-screen filter blur-[90px] sm:blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${palette.secondary} 0%, rgba(0,0,0,0) 70%)`,
            opacity: intensity === "vibrant" ? 0.85 : 0.7,
            transform: "translate3d(0,0,0)",
          }}
        />

        {/* Orbe 3: Acento / Contraste (Top-Right / Centro-baixo) */}
        <div
          className="absolute top-[25%] -right-[10%] w-[100vw] h-[100vw] max-w-[550px] max-h-[550px] rounded-full animate-mesh-3 mix-blend-screen filter blur-[80px] sm:blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${palette.accent} 0%, rgba(0,0,0,0) 65%)`,
            opacity: intensity === "vibrant" ? 0.75 : 0.6,
            transform: "translate3d(0,0,0)",
          }}
        />

        {/* Orbe 4: Pulso Central Suave */}
        <div
          className="absolute top-[35%] left-[10%] w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] rounded-full animate-mesh-4 mix-blend-screen filter blur-[75px] sm:blur-[95px]"
          style={{
            background: `radial-gradient(circle, ${palette.primary} 0%, rgba(0,0,0,0) 70%)`,
            opacity: 0.5,
            transform: "translate3d(0,0,0)",
          }}
        />

        {/* Camada de Granulação/Vignette Apple Music para Profundidade e Contraste */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70 pointer-events-none" />
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Camada Anterior em Fade-Out */}
      {prevPalette && isCrossfading && renderMeshLayer(prevPalette, 0, "opacity-0")}

      {/* Camada Atual Ativa */}
      {renderMeshLayer(currentPalette, 1, "opacity-100")}

      {/* Overlay de Vidro Fosco / Glass Tint */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          backdropFilter: "blur(0.5px)",
        }}
      />

      {/* Conteúdo Renderizado por cima (Player, Letras, etc.) */}
      <div className="relative z-10 size-full flex flex-col">{children}</div>
    </div>
  )
}
