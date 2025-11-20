// app/api/ogtest/route.ts
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 64,
          fontWeight: '700',
          background: 'linear-gradient(135deg, #111827, #1f2937, #4b5563)',
          color: 'white',
        },
        children: 'R3 OG TEST 👍',
      },
    },
    {
      width: 1200,
      height: 630,
    }
  )
}
