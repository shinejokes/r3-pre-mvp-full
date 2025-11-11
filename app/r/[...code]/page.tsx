// app/r/[...code]/page.tsx
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: { code?: string[] };
  searchParams?: { pv?: string };
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://r3-pre-mvp-full.vercel.app";
}

function getCode(params: Props["params"]) {
  return Array.isArray(params?.code) && params.code.length > 0 ? params.code[0] : "unknown";
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const code = getCode(params);
  const base = getBaseUrl();

  // 1) 쿼리로 미리보기 강제
  const pv = searchParams?.pv;
  let isPreview = pv === "2";

  // 2) UA 보조 감지 (선택)
  try {
    const h = await headers();
    const ua = h.get("user-agent") || "";
    if (/Kakao|Kakaotalk|KakaoScrap/i.test(ua)) isPreview = true;
  } catch {
    /* no-op */
  }

  if (isPreview) {
    const title = `R3 공유 링크 미리보기`;
    const desc = "전달·조회가 추적되는 R3 공유 링크입니다.";
    const og = `${base}/api/ogimage?shareId=${encodeURIComponent(code)}`;

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        type: "website",
        url: `${base}/r/${code}`,
        images: [{ url: og }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [og],
      },
    };
  }

  return {
    title: `R3 • ${code}`,
    description: "R3 공유 링크",
  };
}

export default async function RPage({ params, searchParams }: Props) {
  const base = getBaseUrl();
  const code = getCode(params);
  const isPreview = searchParams?.pv === "2";

  if (isPreview) {
    // ⚠️ 미리보기 모드에서는 절대 redirect 금지
    return (
      <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>R3 링크 미리보기</h1>
        <p style={{ marginTop: 8, opacity: 0.7 }}>
          코드: <b>{code}</b>
        </p>
        <p style={{ marginTop: 16 }}>
          이 페이지는 <b>카카오/프리뷰 전용</b>으로 200 OK와 OG 이미지를 제공합니다.
        </p>
        <p style={{ marginTop: 16 }}>
          실제 열람은 <Link href={`${base}/r/${code}`}>이 링크</Link>로 접근하세요.
        </p>
      </main>
    );
  }

  // 일반 브라우저 모드
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>R3 링크</h1>
      <p style={{ marginTop: 8 }}>
        코드: <b>{code}</b>
      </p>
      <p style={{ marginTop: 16 }}>
        배지·조회수 스크립트가 동작하는 일반 모드입니다. (카카오는 미리보기 모드)
      </p>
    </main>
  );
}
