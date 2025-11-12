// app/r/[ref]/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { ref: string };

const BOT_UA =
  /(KakaoTalk|KAKAOTALK|Kakao.*Scrap|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|Discordbot)/i;

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null; // ← 실제 컬럼명
  // thumb_url, views 컬럼은 현재 테이블에 없음
};

async function getShare(ref: string): Promise<ShareRow | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("ref_code,title,original_url") // ← 존재하는 컬럼만!
    .eq("ref_code", ref)
    .single();

  if (error) return null;
  return data as ShareRow;
}

export async function generateMetadata({ params }: { params: Params }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const share = await getShare(params.ref);
  const title = (share?.title?.trim() && share.title) || "R3 Link Preview";
  const description = share
    ? `이 링크는 R3를 통해 공유되었습니다.`
    : "공유 링크를 찾을 수 없습니다.";

  const safeRef = params.ref ?? "unknown";
  // 캐시 버스터 버전 ↑ 숫자만 바꾸면 강제로 새 이미지 사용
  const ogImage = `${site}/api/ogimage?shareId=${encodeURIComponent(
    safeRef
  )}&v=2`;

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

export default async function RPage({ params }: { params: Params }) {
  const h = await headers(); // Next 16: Promise
  const ua = h.get("user-agent") ?? "";
  const isBot = BOT_UA.test(ua);

  const share = await getShare(params.ref);

  if (!share) {
    if (!isBot) redirect("/");
    return (
      <main style={{ padding: 24 }}>
        <h1>공유 링크를 찾을 수 없습니다.</h1>
        <p>ref: {params.ref}</p>
      </main>
    );
  }

  // 사람(브라우저)은 목적지로 이동
  if (!isBot) {
    redirect(share.original_url || "/");
  }

  // 봇(스크래퍼) 이면 미리보기용 콘텐츠
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
    </main>
  );
}
