// app/r/_ping/route.ts
import { NextResponse } from 'next/server'

export function GET() {
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
