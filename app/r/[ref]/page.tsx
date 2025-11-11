// app/r/[ref]/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabaseServer"; // 경로 주의!

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { ref: string };
const BOT_UA = /(KakaoTalk|KAKAOTALK|Kakao.*Scrap|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|Discordbot)/i;

async function getShare(ref: string) {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("ref_code,title,target_url,thumb_url,views")
    .eq("ref_code", ref)
    .single();
  return data as
    | { ref_code: string; title: string | null; target_url: string; thumb_url: string | null; views: number | null }
    | null;
}

export async function generateMetadata({ params }: { params: Params }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const share = await getShare(params.ref);

  const title = share?.title?.trim() || "R3 Link Preview";
  const description = share
    ? `이 링크는 R3를 통해 공유되었습니다. 조회수: ${share.views ?? 0}`
    : "공유 링크를 찾을 수 없습니다.";

  const ogImage = share?.thumb_url
    ? share.thumb_url
    : `${site}/api/ogimage?shareId=${encodeURIComponent(params.ref)}`;

  const canonical = `${site}/r/${encodeURIComponent(params.ref)}`;

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
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function RPage({ params }: { params: Params }) {
  const ua = headers().get("user-agent") || "";
  const isBot = BOT_UA.test(ua);
  const share = await getShare(params.ref);

  if (!share) {
    if (!isBot) redirect("/");
    return (
      <main style={{ padding: 24 }}>
        <h1>링크를 찾을 수 없습니다</h1>
        <p>ref: {params.ref}</p>
      </main>
    );
  }

  if (!isBot) redirect(share.target_url);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>{share.title ?? "R3 공유 링크"}</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>
        조회수: {share.views ?? 0} · 코드: {share.ref_code}
      </p>
      <p style={{ marginTop: 16 }}>
        대상: <a href={share.target_url}>{share.target_url}</a>
      </p>
      <p style={{ fontSize: 12, opacity: 0.7 }}>(이 페이지는 스크래퍼용 미리보기입니다.)</p>
    </main>
  );
}
