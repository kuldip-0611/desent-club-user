import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Disent Club'
  const subtitle = searchParams.get('subtitle') ?? 'Premium streetwear & essentials'
  const imageUrl = searchParams.get('image') ?? null

  const imgResponse = new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Left — text panel (solid dark = tiny PNG) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 56px',
            width: imageUrl ? '580px' : '1200px',
            flexShrink: 0,
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#6366f1',
                borderRadius: '12px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                color: 'white',
                fontWeight: 900,
              }}
            >
              D
            </div>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Disent Club
            </span>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ color: 'rgba(99,102,241,0.9)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
              {subtitle}
            </p>
            <h1
              style={{
                color: 'white',
                fontSize: title.length > 35 ? '48px' : '60px',
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {title}
            </h1>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '999px',
                padding: '14px 32px',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              Shop Now →
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
              dev.disentclub.com
            </span>
          </div>
        </div>

        {/* Right — product image (contained, not full-bleed) */}
        {imageUrl && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
            {/* Subtle left-edge fade into dark panel */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '80px',
                background: 'linear-gradient(to right, #1e293b, transparent)',
              }}
            />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  )

  // Add cache headers — WhatsApp bot must be able to cache this image
  return new Response(imgResponse.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
