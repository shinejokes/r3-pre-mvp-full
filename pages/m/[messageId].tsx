import { GetServerSideProps } from 'next';
import { supabaseServer } from '../../server/supabase';
import { useState } from 'react';

type Props = {
  messageId: string;
  shares: number;
  hits: number;
  firstRef?: string;
};

export default function Dashboard({ messageId, shares, hits, firstRef }: Props) {
  const [myRef, setMyRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function makeMyShare() {
    try {
      setBusy(true);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, parent_share_id: null })
      });
      const data = await r.json();
      setMyRef(data.ref);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main style={{maxWidth:680, margin:'40px auto', fontFamily:'system-ui,sans-serif'}}>
      <h1>대시보드</h1>
      <div>Message ID: {messageId}</div>
      <div>총 Shares: {shares}</div>
      <div>총 Hits: {hits}</div>
      {firstRef && (
        <div style={{marginTop:12}}>
          등록자 공유 링크: <a href={`/${firstRef}`} target="_blank">/{firstRef}</a>
        </div>
      )}
      <hr style={{margin:'16px 0'}}/>
      <button onClick={makeMyShare} disabled={busy}>{busy ? '생성 중…' : '내 공유 링크 만들기'}</button>
      {myRef && <div style={{marginTop:8}}>내 링크: <a href={`/${myRef}`} target="_blank">/{myRef}</a></div>}
      <p style={{color:'#666', marginTop:12, fontSize:13}}>※ 내 링크로 공유하면 shares가 1 증가하고, 클릭은 hits에 누적됩니다.</p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const messageId = ctx.params?.messageId as string;
  const s = supabaseServer();
  const { count: shares } = await s.from('r3_shares').select('*', { count: 'exact', head: true }).eq('message_id', messageId);
  const { data: one } = await s.from('r3_shares').select('ref_code').eq('message_id', messageId).limit(1).maybeSingle();
  const ids = (await s.from('r3_shares').select('id').eq('message_id', messageId)).data?.map(r => r.id) || [-1];
  const { count: hits } = await s.from('r3_hits').select('id', { count: 'exact', head: true }).in('share_id', ids);
  return { props: { messageId, shares: shares || 0, hits: hits || 0, firstRef: one?.ref_code || null } };
};
