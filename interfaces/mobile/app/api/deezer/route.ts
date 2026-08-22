// ─── Next.js API Route: Deezer Proxy (CORS workaround) ──────────────
// GET /api/deezer?path=/chart
// GET /api/deezer?path=/search?q=billie+eilish

import { NextRequest, NextResponse } from "next/server"

const DEEZER_BASE = "https://api.deezer.com"

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path")
  if (!path) {
    return NextResponse.json({ error: "Missing ?path= parameter" }, { status: 400 })
  }

  try {
    const res = await fetch(`${DEEZER_BASE}${path}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Deezer responded with ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
