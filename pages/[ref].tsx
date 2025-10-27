import { GetServerSideProps } from 'next';
import { supabaseServer } from '../server/supabase';
import type { NextPage } from 'next';
import crypto from 'crypto';

type Props = {
  redirect: string;
  views: number;
};

const RefPage: NextPage<Props> = ({ redirect, views }) => {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 40,
        textAlign: 'center',
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        이 메시지는 지금까지 <b>{views}</b>명이 열람했습니다.
      </h1>
      <p>곧 원본 페이지로 이동합니다…</p>
      <p>
        <a href={redirect}>자동 이동이 안 되면 이곳을 클릭하세요</a>
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function(){
              window.location.href=${JSON.stringify(redirect)};
            }, 1000);
          `,
        }}
      />
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const ref = ctx.params?.ref as string;
  const s = supabaseServer();

  // 1. 공유코드로 share 찾기
  const { data: share } = await s
    .from('r3_shares')
    .select('id, message_id')
    .eq('ref_code', ref)
    .single();

  if (!share) return { notFound: true };

  // 2. fingerprint 계산 (쿠키 or 새 생성)
  const cookieName = 'r3fp';
  let fp = ctx.req.cookies?.[cookieName];

  if (!fp) {
    const ua = ctx.req.headers['user-agent'] || '';
    const forwarded = (ctx.req.headers['x-forwarded-for'] as string) || '';
    const ip =
      (forwarded.split(',')[0] || '').trim() ||
      (ctx.req.socket.remoteAddress || '');
    fp = crypto
      .createHash('sha256')
      .update(ua + '|' + ip)
      .digest('hex')
      .slice(0, 16);
  }

  // 3. hits 기록
  await s
    .from('r3_hits')
    .insert({ share_id: share.id, viewer_fingerprint: fp })
    .select('id')
    .maybeSingle();

  // 4. fingerprint 쿠키 1일 보관
  ctx.res.setHeader(
    'Set-Cookie',
    `${cookieName}=${fp}; Path=/; Max-Age=86400; HttpOnly`
  );

  // 5. 총 조회수 계산
  const { count } = await s
    .from('r3_hits')
    .select('id', { count: 'exact', head: true })
    .eq('share_id', share.id);

  // 6. 메시지 원본 URL 가져오기
  const { data: msg } = await s
    .from('r3_messages')
    .select('origin_url')
    .eq('id', share.message_id)
    .single();

  return {
    props: {
      redirect: msg?.origin_url ?? '/',
      views: count ?? 0,
    },
  };
};

export default RefPage;
