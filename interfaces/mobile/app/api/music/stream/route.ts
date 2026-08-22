// ─── Next.js API Route: YouTube Audio Stream via yt-dlp ─────────────
// GET /api/music/stream?q=artist+title
// Returns: { url: string, title: string, duration: number }
//
// Uses yt-dlp to search YouTube and extract direct audio URL.
// The URL is a temporary signed URL from YouTube that expires (~6h).

import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Path to Python
const PYTHON = process.env.PYTHON_PATH || "python"

// In-memory cache for audio URLs (they expire after ~6h on YouTube)
const urlCache = new Map<string, { url: string; title: string; duration: number; ts: number }>()
const URL_CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours (safe margin before YT expiry)

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")
  if (!query) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 })
  }

  // Check cache
  const cacheKey = query.toLowerCase().trim()
  const cached = urlCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < URL_CACHE_TTL) {
    return NextResponse.json(cached)
  }

  try {
    const safeQuery = query.replace(/[&|<>^%"]/g, " ").trim()
    const cmd = `"${PYTHON}" -m yt_dlp --no-warnings --no-playlist -f "bestaudio[ext=m4a]/bestaudio/best" --get-url --get-title --get-duration "ytsearch1:${safeQuery}"`

    const { stdout } = await execAsync(cmd, {
      timeout: 20000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    })

    const rawLines = stdout.trim().split(/\r?\n/)
    // Filter out warnings and empty lines
    const cleanLines = rawLines.filter(
      (line) =>
        !line.startsWith("WARNING") &&
        !line.startsWith("Deprecated") &&
        !line.startsWith("ERROR") &&
        line.trim().length > 0
    )

    // Find the URL line (starts with http)
    const urlIndex = cleanLines.findIndex((line) => line.startsWith("http"))
    if (urlIndex !== -1) {
      const url = cleanLines[urlIndex]
      const title = urlIndex > 0 ? cleanLines[0] : query
      const durStr = cleanLines[urlIndex + 1] || "0"
      
      let duration = 0
      if (durStr.includes(":")) {
        const parts = durStr.split(":").map(Number)
        if (parts.length === 2) duration = parts[0] * 60 + parts[1]
        else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else {
        duration = parseInt(durStr, 10) || 0
      }

      if (url && url.startsWith("http")) {
        const entry = { url, title, duration, ts: Date.now() }
        urlCache.set(cacheKey, entry)
        return NextResponse.json(entry)
      }
    }

    return NextResponse.json({ error: "No stream found" }, { status: 404 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[yt-dlp error]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
