// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'

export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,        // Supabase 프로젝트 주소
    process.env.SUPABASE_SERVICE_ROLE_KEY!,       // Service Role Key (서버 전용 비밀키)
    {
      auth: { persistSession: false }
    }
  )
}
