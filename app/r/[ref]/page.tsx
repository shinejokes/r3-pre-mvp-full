// app/r/[ref]/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// ✅ Next 16에서 동적 파라미터 인식 강제
export const dynamicParams = true;

type Params = { ref: string };

const BOT_UA =
  /(KakaoTalk|KAKAOTALK|Kakao.*Scrap|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|Discordbot)/i;

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null;
};

// --- DB 조회 ---
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

// --- OG 메타데이터 (스크래퍼가 읽음) ---
export async function generateMetadata({ params }: { params: Params }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  // 🔎 디버그: 파라미터 확인
  console.log("[OG] params.ref =", params?.ref);

  const safeRef = params?.ref ?? "NO_PARAM";
  const share = safeRef === "NO_PARAM" ? null : await getShare(safeRef);

  const title =
    (share?.title?.trim() && share.title) || `R3 Debug ${safeRef}`;
  const description = share
    ? "이 링크는 R3를 통해 공유되었습니다."
    : "공유 링크를 찾을 수 없습니다.";

  // ✅ 캐시 버스터 v=6
  const ogImage = `${site}/api/ogimage?shareId=${encodeURIComponent(
    safeRef
  )}&v=6`;

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

// --- 실제 페이지 (사람/봇 분기) ---
export default async function RPage({ params }: { params: Params }) {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const isBot = BOT_UA.test(ua);

  // 🔎 디버그: HTML에도 파라미터 찍기
  const safeRef = params?.ref ?? "NO_PARAM";

  const share = safeRef === "NO_PARAM" ? null : await getShare(safeRef);

  if (!share) {
    if (!isBot) redirect("/");
    return (
      <main style={{ padding: 24 }}>
        <h1>공유 링크를 찾을 수 없습니다.</h1>
        <p>debug ref: {safeRef}</p>
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
      <p style={{ fontSize: 12, opacity: 0.6 }}>
        debug ref: {safeRef}
      </p>
    </main>
  );
}
