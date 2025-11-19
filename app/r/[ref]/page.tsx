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

// --- OG 메타데이터 (여긴 굳이 디버그 안 해도 됨, 그대로 둠) ---
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();

  const { data: share } = await supabase
    .from("r3_shares")
    .select("ref_code, hop, message_id")
    .eq("ref_code", params.ref)
    .maybeSingle();

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

  let messageTitle: string | undefined;
  try {
    const { data: message } = await supabase
      .from("r3_messages")
      .select("id, title")
      .eq("id", share.message_id)
      .maybeSingle();

    messageTitle = message?.title ?? undefined;
  } catch {
    // ignore
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

// --- 실제 페이지 (여기에 디버그 정보 표시) ---
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();

  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, ref_code, hop, message_id")
    .eq("ref_code", params.ref)
    .maybeSingle();

  // ✅ share 가 없을 때 디버그 정보 화면에 그대로 표시
  if (!share) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <h1>공유를 찾을 수 없습니다 (디버그 모드)</h1>
        <p>아래 디버그 정보를 친구에게 캡처해서 보내 주시게.</p>

        <h2 style={{ marginTop: 24, fontSize: 18 }}>요청 정보</h2>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 12,
            borderRadius: 6,
            fontSize: 13,
            overflowX: "auto",
          }}
        >
{`params.ref = "${params.ref}"
length = ${params.ref.length}`}
        </pre>

        <h2 style={{ marginTop: 24, fontSize: 18 }}>Supabase error 객체</h2>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 12,
            borderRadius: 6,
            fontSize: 13,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    );
  }

  // ✅ 여기부터는 share 를 찾았을 때의 정상 화면
  const hop = share.hop ?? 1;

  // message_id 로 r3_messages 조회
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

      <ShareActions refCode={share.ref_code} />
    </main>
  );
}
