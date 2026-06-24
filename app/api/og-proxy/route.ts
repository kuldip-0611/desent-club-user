import { type NextRequest, NextResponse } from 'next/server'

// Proxy external images (Unsplash etc.) so social scrapers see them served
// from our domain — scrapers often block Unsplash's CDN UA checks.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only proxy images we trust (Unsplash CDN)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }
  const allowed = ['images.unsplash.com', 'plus.unsplash.com', 'source.unsplash.com']
  if (!allowed.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DisentClubBot/1.0)',
        Accept: 'image/webp,image/png,image/jpeg,image/*',
      },
      next: { revalidate: 86400 }, // cache 24 h
    })
    if (!res.ok) return new NextResponse('Upstream error', { status: 502 })

    const blob = await res.blob()
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    return new NextResponse(blob.stream(), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return new NextResponse('Proxy error', { status: 502 })
  }
}
