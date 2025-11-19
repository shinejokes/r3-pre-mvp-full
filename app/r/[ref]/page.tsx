// app/r/[ref]/page.tsx
import { supabaseServer } from "../../../lib/supabaseServer";
import ShareClient from "./ShareClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { ref: string };
};

// 카카오/페북 썸네일 메타데이터
export async function generateMetadata({ params }: PageProps) {
  const ref = params.ref;
  const supabase = supabaseServer();

  const { data: share } = await supabase
    .from("r3_shares")
    .select("ref_code, title, target_url")
    .eq("ref_code", ref)
    .maybeSingle();

  const baseUrl =
    process.env.R3_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://r3-pre-mvp-full.vercel.app";

  const defaultTitle = "R3 공유 링크";
  const defaultDesc = "R3를 통해 공유된 링크입니다.";

  const title = share?.title || defaultTitle;
  const description = share?.target_url || defaultDesc;

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
      images: [{ url: ogImageUrl }],
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

  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, ref_code, hop, title, target_url")
    .eq("ref_code", ref)
    .maybeSingle();

  if (error) {
    console.error("[R3] share load error:", error);
  }

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

  const originUrl = share.target_url || undefined;
  const title = share.title || "R3 공유 링크";

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
        parentRef={share.ref_code}
        hop={share.hop ?? 1}
        originUrl={originUrl}
        title={title}
      />
    </main>
  );
}
