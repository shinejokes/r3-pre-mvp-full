import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저/서버 공용 클라이언트 (read 전용)
export const supabase = createClient(url, anon);
