// app/r/[ref]/page.tsx
import { Metadata } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";
import ShareActions from "./ShareActions";

type PageProps = {
  params: {
    ref: string;
  };
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://r3-pre-mvp-full.vercel.app";

// --- OG 썸네일용 메타데이터 ---
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();

  // 1) r3_shares 에서 조인 없이 row만 조회
  const { data: share } = await supabase
    .from("r3_shares")
    .select("ref_code, hop, message_id")
    .eq("ref_code", params.ref)
    .maybeSingle();

  // share 를 못 찾은 경우: 임시 기본 메타데이터
  if (!share) {
    const title = "R3 Home 임시 홈페이지";
    const description = "R3 테스트용 링크입니다.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  }

  // 2) message_id 를 이용해 r3_messages 를 별도 조회(실패해도 앱은 동작)
  let messageTitle: string | undefined;
  try {
    const { data: message } = await supabase
      .from("r3_messages")
      .select("id, title")
      .eq("id", share.message_id)
      .maybeSingle();

    messageTitle = message?.title ?? undefined;
  } catch {
    // 메타데이터에서 제목이 없어도 치명적이지 않으니 무시
  }

  const title = messageTitle || "R3 공유 링크";
  const description = `이 메시지는 손만두 hop ${share.hop ?? 1} 링크입니다.`;
  const ogImageUrl = `${BASE_URL}/api/ogimage?shareId=${share.ref_code}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// --- 실제 프리뷰 페이지 ---
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();

  // 1) 먼저 r3_shares 를 조인 없이 조회
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, ref_code, hop, message_id")
    .eq("ref_code", params.ref)
    .single();

  if (error || !share) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <h1>공유를 찾을 수 없습니다</h1>
        <p>잘못된 링크이거나 삭제된 링크일 수 있습니다.</p>
      </main>
    );
  }

  // 2) message_id 로 r3_messages 조회 (없으면 제목/URL만 비우고 계속 진행)
  let message: { id: number; title?: string | null; url?: string | null } | null =
    null;

  const { data: msgData } = await supabase
    .from("r3_messages")
    .select("id, title, url")
    .eq("id", share.message_id)
    .maybeSingle();

  if (msgData) {
    message = msgData;
  }

  const hop = share.hop ?? 1;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>R3 메시지 프리뷰</h1>
      <p style={{ marginBottom: 16, fontSize: 14, color: "#555" }}>
        이 링크의 hop 값은 <b>{hop}</b> 입니다. (ref: <code>{share.ref_code}</code>)
      </p>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          {message?.title ?? "제목 없는 메시지"}
        </h2>
        {message?.url && (
          <p style={{ wordBreak: "break-all", marginBottom: 8 }}>
            원본 링크:{" "}
            <a href={message.url} target="_blank" rel="noopener noreferrer">
              {message.url}
            </a>
          </p>
        )}
        <p style={{ fontSize: 13, color: "#777" }}>
          이 페이지를 카카오톡 등에 공유하면, OG 이미지로 조회수·hop 배지가
          포함된 썸네일이 표시됩니다.
        </p>
      </section>

      {/* 내 링크 만들기 버튼 */}
      <ShareActions refCode={share.ref_code} />
    </main>
  );
}
