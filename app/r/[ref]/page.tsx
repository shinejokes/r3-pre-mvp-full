// app/r/[ref]/page.tsx
import { supabaseServer } from "../../../lib/supabaseServer";
import ShareClient from "./ShareClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { ref: string };
};

// 카카오/페북 썸네일을 위한 메타데이터
export async function generateMetadata({ params }: PageProps) {
  const ref = params.ref;
  const supabase = supabaseServer();

  // ref_code → share → message(title, url) 조회 (실패하면 그냥 기본값)
  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, message_id, hop")
    .eq("ref_code", ref)
    .maybeSingle();

  let title = "R3 공유 링크";
  let description = "R3를 통해 공유된 링크입니다.";
  let originUrl: string | undefined;

  if (share?.message_id) {
    const { data: message } = await supabase
      .from("r3_messages")
      .select("title, url")
      .eq("id", share.message_id)
      .maybeSingle();

    if (message?.title) title = message.title;
    if (message?.url) {
      description = message.url;
      originUrl = message.url;
    }
  }

  const baseUrl =
    process.env.R3_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://r3-pre-mvp-full.vercel.app";

  const ogImageUrl = `${baseUrl.replace(
    /\/$/,
    ""
  )}/api/ogimage?shareId=${encodeURIComponent(ref)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
        },
      ],
      url: `${baseUrl.replace(/\/$/, "")}/r/${ref}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const ref = params.ref;
  const supabase = supabaseServer();

  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, message_id, hop")
    .eq("ref_code", ref)
    .maybeSingle();

  if (!share) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            padding: "24px 32px",
            borderRadius: "12px",
            background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>링크를 찾을 수 없습니다</h1>
          <p style={{ margin: 0, color: "#666" }}>
            잘못된 링크이거나, 삭제된 링크일 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  // 원본 URL 조회 (없으면 undefined)
  let originUrl: string | undefined;
  const { data: message } = await supabase
    .from("r3_messages")
    .select("url, title")
    .eq("id", share.message_id)
    .maybeSingle();

  if (message?.url) originUrl = message.url;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <ShareClient
        parentRef={ref}
        hop={share.hop ?? 1}
        originUrl={originUrl}
        title={message?.title ?? "R3 공유 링크"}
      />
    </main>
  );
}
