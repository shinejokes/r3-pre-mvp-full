import Head from "next/head";
import { GetServerSideProps } from "next";
import { supabaseServer } from "../../server/supabase";

type Props = {
  messageId: string;
  snippet: string;
  hits: number;
  sharers: number;
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const messageId = context.params?.messageId as string;

  // supabase 클라이언트 인스턴스를 생성한다
  const supabase = supabaseServer();

  // 실제 테이블/컬럼명을 읽어와야 한다.
  // 지금은 messages 테이블에
  //  - textSnippet
  //  - totalHits
  //  - uniqueSharers
  // 라는 컬럼이 있다고 가정한다.
  // (다르면 아래 select(...)와 data.XXX 부분만 바꾸면 된다.)
  const { data, error } = await supabase
    .from("messages")
    .select("textSnippet, totalHits, uniqueSharers")
    .eq("id", messageId)
    .single();

  const snippet =
    !error && data?.textSnippet ? data.textSnippet : "(not found)";
  const hits =
    !error && data?.totalHits ? data.totalHits : 0;
  const sharers =
    !error && data?.uniqueSharers ? data.uniqueSharers : 0;

  return {
    props: {
      messageId,
      snippet,
      hits,
      sharers,
    },
  };
};

export default function PreviewPage({ messageId, snippet, hits, sharers }: Props) {
  // og:title / og:description에 들어갈 텍스트
  const titleText = `[${hits} views · ${sharers} sharers] ${snippet.slice(0, 40)}`;
  const descText = snippet.slice(0, 120) || "Shared via R3";

  // 이건 자네의 실제 프로덕션 URL (Vercel의 production domain)
  const baseUrl = "https://r3-pre-mvp-full.vercel.app";

  // SNS 썸네일 이미지 주소 (우리가 /api/preview-card/[messageId].ts 로 만들었던 그것)
  // NOTE: vercel/prod 환경에서 접근할 것이므로 절대경로여야 한다
  const imageUrl = `${baseUrl}/api/preview-card/${messageId}`;

  return (
    <>
      <Head>
        <title>{titleText}</title>

        {/* Open Graph metadata: KakaoTalk, Facebook, LINE, etc. */}
        <meta property="og:title" content={titleText} />
        <meta property="og:description" content={descText} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${baseUrl}/p/${messageId}`} />

        {/* Twitter Card (X) metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={titleText} />
        <meta name="twitter:description" content={descText} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <main style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
        <h1>R3 Message Preview</h1>

        <p><strong>ID:</strong> {messageId}</p>
        <p><strong>Snippet:</strong> {snippet}</p>
        <p><strong>Total views (hits):</strong> {hits}</p>
        <p><strong>Unique sharers:</strong> {sharers}</p>

        <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
          This is the public share link for R3.
          Social spread stats (views / sharers) are exposed here so that
          KakaoTalk / Facebook / X can display them in link previews.
        </p>
      </main>
    </>
  );
}
