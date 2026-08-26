/**
 * Fast Client-Side Color Extraction & Palette Generation (Apple Music Style)
 * Zero external network calls. Uses Canvas 2D image sampling + HSL clustering.
 */

export interface TrackColorPalette {
  primary: string      // Cor vibrante mais dominante
  secondary: string    // Segunda cor harmônica
  accent: string       // Cor de contraste / destaque
  darkBackground: string // Fundo escuro profundo para contraste
  isDark: boolean
}

// Paleta padrão equilibrada e elegante para fallback imediato
export const DEFAULT_PALETTE: TrackColorPalette = {
  primary: "#3b82f6",      // Azul moderno
  secondary: "#8b5cf6",    // Roxo suave
  accent: "#ec4899",       // Rosa vibrante
  darkBackground: "#090d16", // Navy quase preto
  isDark: true,
}

// Cache local em memória por URL de capa para transições ultra-rápidas (<1ms)
const colorPaletteCache = new Map<string, TrackColorPalette>()

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Extrai 3 a 4 cores dominantes a partir do elemento de imagem ou URL no canvas
 */
export async function extractPaletteFromImage(imageUrl?: string): Promise<TrackColorPalette> {
  if (!imageUrl) return DEFAULT_PALETTE

  if (colorPaletteCache.has(imageUrl)) {
    return colorPaletteCache.get(imageUrl)!
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.referrerPolicy = "no-referrer"

    // Timeout de segurança para resolver fallback se imagem falhar/bloquear CORS
    const timer = setTimeout(() => {
      resolve(DEFAULT_PALETTE)
    }, 1200)

    img.onload = () => {
      clearTimeout(timer)
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          resolve(DEFAULT_PALETTE)
          return
        }

        // Downscale para 48x48 para extração instantânea em <3ms
        const size = 48
        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, 0, 0, size, size)

        const imageData = ctx.getImageData(0, 0, size, size).data
        const colorBuckets: { [key: string]: { rgb: RGB; count: number; hsl: HSL } } = {}

        // Varredura de pixels agrupando por matiz e saturação
        for (let i = 0; i < imageData.length; i += 16) { // step de 4 pixels para performance máxima
          const r = imageData[i]
          const g = imageData[i + 1]
          const b = imageData[i + 2]
          const a = imageData[i + 3]

          if (a < 128) continue // Ignora transparentes

          const hsl = rgbToHsl(r, g, b)

          // Ignora brancos extremos ou pretos absolutos para focar em cores ricas
          if (hsl.l < 10 || hsl.l > 92) continue

          // Quantiza o matiz em 12 setores
          const hueSector = Math.floor(hsl.h / 30) * 30
          const satSector = Math.floor(hsl.s / 25) * 25
          const key = `${hueSector}-${satSector}`

          if (!colorBuckets[key]) {
            colorBuckets[key] = { rgb: { r, g, b }, count: 0, hsl }
          }
          colorBuckets[key].count++
        }

        const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count)

        if (sorted.length === 0) {
          resolve(DEFAULT_PALETTE)
          return
        }

        // 1. Primária: Cor mais frequente com saturação razoável
        const primaryHsl = sorted[0].hsl
        // Ajusta saturação e luminosidade para garantir estética Apple Music vibrante
        const vibrantPrimary = hslToHex(
          primaryHsl.h,
          Math.max(60, Math.min(90, primaryHsl.s)),
          Math.max(45, Math.min(65, primaryHsl.l))
        )

        // 2. Secundária: Cor de outro setor ou variação harmônica (+40 graus)
        const secondBucket = sorted.find((b) => Math.abs(b.hsl.h - primaryHsl.h) > 30)
        const secondaryHsl = secondBucket ? secondBucket.hsl : { h: (primaryHsl.h + 45) % 360, s: 75, l: 55 }
        const vibrantSecondary = hslToHex(
          secondaryHsl.h,
          Math.max(65, Math.min(95, secondaryHsl.s)),
          Math.max(40, Math.min(60, secondaryHsl.l))
        )

        // 3. Acento / Destaque: Cor complementar oposta (~150 a 180 graus)
        const thirdBucket = sorted.find(
          (b) => Math.abs(b.hsl.h - primaryHsl.h) > 80 && Math.abs(b.hsl.h - secondaryHsl.h) > 40
        )
        const accentHsl = thirdBucket ? thirdBucket.hsl : { h: (primaryHsl.h + 160) % 360, s: 85, l: 60 }
        const vibrantAccent = hslToHex(
          accentHsl.h,
          Math.max(70, Math.min(100, accentHsl.s)),
          Math.max(50, Math.min(70, accentHsl.l))
        )

        // 4. Fundo Escuro Profundo: Tom escuro da cor primária com 8-12% de luminosidade
        const darkBackground = hslToHex(primaryHsl.h, Math.min(45, primaryHsl.s), 8)

        const palette: TrackColorPalette = {
          primary: vibrantPrimary,
          secondary: vibrantSecondary,
          accent: vibrantAccent,
          darkBackground: darkBackground,
          isDark: true,
        }

        colorPaletteCache.set(imageUrl, palette)
        resolve(palette)
      } catch (err) {
        console.warn("[PaletteExtractor] Falha na extração, usando default:", err)
        resolve(DEFAULT_PALETTE)
      }
    }

    img.onerror = () => {
      clearTimeout(timer)
      resolve(DEFAULT_PALETTE)
    }

    img.src = imageUrl
  })
}
