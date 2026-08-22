"use client"

import { useState } from "react"
import { Music } from "lucide-react"

interface TrackImageProps {
  src?: string
  trackId?: string
  alt: string
  className?: string
}

export function TrackImage({ src, trackId, alt, className = "" }: TrackImageProps) {
  const defaultSrc = src || (trackId ? `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg` : "")
  const [imgSrc, setImgSrc] = useState<string>(defaultSrc)
  const [hasError, setHasError] = useState<boolean>(false)
  const [fallbackStep, setFallbackStep] = useState<number>(0)

  const handleError = () => {
    if (fallbackStep === 0 && trackId) {
      setFallbackStep(1)
      setImgSrc(`https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`)
    } else if (fallbackStep === 1 && trackId) {
      setFallbackStep(2)
      setImgSrc(`https://i.ytimg.com/vi/${trackId}/mqdefault.jpg`)
    } else {
      setHasError(true)
    }
  }

  if (hasError || !imgSrc) {
    return (
      <div className={`bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 flex items-center justify-center border border-white/5 ${className}`}>
        <Music className="size-1/3 text-zinc-500 stroke-1" />
      </div>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={handleError}
      loading="lazy"
      className={className}
    />
  )
}
