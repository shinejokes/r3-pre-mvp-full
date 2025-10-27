import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '../../server/supabase';
import { makeRefCode } from '../../utils/ref';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { message_id, parent_share_id } = req.body || {};
    if (!message_id) return res.status(400).json({ error: 'message_id required' });

    const s = supabaseServer();

    const { data: user, error: uerr } = await s.from('r3_users').insert({}).select('id').single();
    if (uerr) throw new Error('r3_users insert failed: ' + uerr.message);

    const ref = makeRefCode(7);
    const { data, error: serr } = await s.from('r3_shares')
      .insert({ message_id, sender_id: user!.id, parent_share_id: parent_share_id || null, ref_code: ref })
      .select('ref_code')
      .single();
    if (serr) throw new Error('r3_shares insert failed: ' + serr.message);

    res.status(200).json({ ref: data!.ref_code });
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
