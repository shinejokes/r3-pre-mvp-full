import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [creatorHint, setCreatorHint] = useState('');
  const [result, setResult] = useState(null as any);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e:any) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin_url: url, title, creator_hint: creatorHint })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (err:any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{maxWidth:680, margin:'40px auto', fontFamily:'system-ui, sans-serif'}}>
      <h1>R3 pre‑MVP</h1>
      <p>1) 아래에 원본 링크(예: YouTube URL)를 입력 → <b>메시지 등록</b><br/>2) 생성된 <b>공유 링크</b>를 눌러 테스트</p>
      <form onSubmit={submit}>
        <label>원본 링크<br/>
          <input value={url} onChange={e=>setUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." style={{width:'100%'}}/></label>
        <br/><br/>
        <label>제목(선택)<br/>
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%'}}/></label>
        <br/><br/>
        <label>원저작자 힌트(선택, 채널명 등)<br/>
          <input value={creatorHint} onChange={e=>setCreatorHint(e.target.value)} style={{width:'100%'}}/></label>
        <br/><br/>
        <button disabled={busy}>{busy ? '등록 중…' : '메시지 등록'}</button>
      </form>
      {error && <div style={{marginTop:12, color:'#b00'}}>{error}</div>}
      {result && (
        <div style={{marginTop:24, padding:12, border:'1px solid #ddd'}}>
          <div>메시지 ID: {result.messageId}</div>
          <div>공유 링크: <a href={`/${result.ref}`} target="_blank">/{result.ref}</a></div>
          <div><a href={`/m/${result.messageId}`} target="_blank">대시보드 보기</a></div>
        </div>
      )}
    </main>
  );
}
