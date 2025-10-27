import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envReport = {
    has_url: !!url,
    has_anon: !!anon,
    has_service: !!service,
    url,
    anon_prefix: anon?.slice(0, 14),
    service_prefix: service?.slice(0, 10)
  };

  try {
    const supa = createClient(url!, service!);
    const { error } = await supa.from('r3_messages').select('id').limit(1);
    return res.status(200).json({ ok: !error, envReport, dbError: error?.message || null });
  } catch (e:any) {
    return res.status(500).json({ ok: false, envReport, caught: e?.message || String(e) });
  }
}
