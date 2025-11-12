// app/r/[...ref]/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

type Params = { ref?: string[] }; // catch-all: /r/aaa → ["aaa"]

const BOT_UA =
  /(KakaoTalk|KAKAOTALK|Kakao.*Scrap|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|Discordbot)/i;

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null;
};

function firstRef(params?: string[] | null): string | null {
  if (!params || params.length === 0) return null;
  return params[0] ?? null;
}

async function getShare(ref: string): Promise<ShareRow | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("ref_code,title,original_url")
    .eq("ref_code", ref)
    .single();
  if (error) return null;
  return data as ShareRow;
}

// ---- OG 메타데이터 ----
export async function generateMetadata({ params }: { params: Params }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const ref = firstRef(params.ref);
  console.log("[OG] raw params.ref =", params.ref, "first =", ref);

  const safeRef = ref ?? "NO_PARAM";
  const share = ref ? await getShare(ref) : null;

  const title =
    (share?.title?.trim() && share.title) || `R3 Debug ${safeRef}`;
  const description = share
    ? "이 링크는 R3를 통해 공유되었습니다."
    : "공유 링크를 찾을 수 없습니다.";

  // 캐시 버스터 v=7
  const ogImage = `${site}/api/ogimage?shareId=${encodeURIComponent(
    safeRef
  )}&v=7`;

  const canonical = `${site}/r/${encodeURIComponent(safeRef)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "R3",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ---- 실제 페이지 ----
export default async function RPage({ params }: { params: Params }) {
  const ref = firstRef(params.ref);
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const isBot = BOT_UA.test(ua);

  if (!ref) {
    if (!isBot) redirect("/");
    return (
      <main style={{ padding: 24 }}>
        <h1>공유 링크를 찾을 수 없습니다.</h1>
        <p>debug ref: NO_PARAM</p>
      </main>
    );
  }

  const share = await getShare(ref);
  if (!share) {
    if (!isBot) redirect("/");
    return (
      <main style={{ padding: 24 }}>
        <h1>공유 링크를 찾을 수 없습니다.</h1>
        <p>debug ref: {ref}</p>
      </main>
    );
  }

  if (!isBot) {
    redirect(share.original_url || "/");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>{share.title ?? "R3 공유 링크"}</h1>
      {share.original_url && (
        <p style={{ marginTop: 16 }}>
          대상: <a href={share.original_url}>{share.original_url}</a>
        </p>
      )}
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        (이 페이지는 스크래퍼용 미리보기입니다.)
      </p>
      <p style={{ fontSize: 12, opacity: 0.6 }}>debug ref: {ref}</p>
    </main>
  );
}
