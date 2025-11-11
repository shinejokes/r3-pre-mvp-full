// app/debug_hit/route.ts
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  return new Response('Debug hit OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
