import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Disent Club'
  const subtitle = searchParams.get('subtitle') ?? 'Premium streetwear & essentials'
  const imageUrl = searchParams.get('image') ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Background product image */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: imageUrl
              ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.55) 60%, rgba(15,23,42,0.3) 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px',
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                backgroundColor: '#6366f1',
                borderRadius: '12px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                fontWeight: 800,
              }}
            >
              D
            </div>
            <span
              style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Disent Club
            </span>
          </div>

          {/* Main text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
            <h1
              style={{
                color: 'white',
                fontSize: title.length > 40 ? '52px' : '68px',
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
                maxWidth: imageUrl ? '640px' : '900px',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>
              dev.disentclub.com
            </span>
            <div
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '999px',
                padding: '12px 28px',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              Shop Now →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
