import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '../../server/supabase';
import { makeRefCode } from '../../utils/ref';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { origin_url, title, creator_hint } = req.body || {};
    if (!origin_url) return res.status(400).json({ error: 'origin_url required' });

    const s = supabaseServer();

    const { data: user, error: uerr } = await s.from('r3_users').insert({}).select('id').single();
    if (uerr) throw new Error('r3_users insert failed: ' + uerr.message);

    const { data: msg, error: merr } = await s.from('r3_messages').insert({
      registrant_id: user!.id,
      origin_url,
      title: title || null,
      creator_hint: creator_hint || null
    }).select('id').single();
    if (merr) throw new Error('r3_messages insert failed: ' + merr.message);

    const ref = makeRefCode(7);
    const { error: serr } = await s.from('r3_shares').insert({
      message_id: msg!.id,
      sender_id: user!.id,
      ref_code: ref
    });
    if (serr) throw new Error('r3_shares insert failed: ' + serr.message);

    return res.status(200).json({ messageId: msg!.id, ref });
  } catch (e:any) {
    console.error('API /message error:', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
