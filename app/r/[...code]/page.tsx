// app/r/[...code]/page.tsx

import { supabaseServer } from "../../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// 공통: 헤더에서 ref 코드 가져오기
async function getRefFromHeader(): Promise<string | null> {
  const h = await headers();
  const ref = h.get("x-r3-ref");
  return ref;
}

// =====================
//  메타데이터 (OG 이미지)
// =====================
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.R3_APP_BASE_URL ?? "https://r3-pre-mvp-full.vercel.app";

  const ref = await getRefFromHeader();

  if (!ref) {
    return {
      title: "R3 · Hand-Forwarded Link",
    };
  }

  const supabase = supabaseServer();
  const { data: share } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", ref)
    .maybeSingle();

  const title = share?.title ?? "R3 · Hand-Forwarded Link";
  const ogImage = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(ref)}`;

  return {
    title,
    openGraph: {
      title,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [ogImage],
    },
  };
}

// =====================
//  실제 페이지 (리다이렉트)
// =====================
export default async function RedirectPage() {
  const supabase = supabaseServer();
  const h = await headers();
  const ref = h.get("x-r3-ref");

  // ref가 없으면 디버그 화면 (헤더 전체 출력)
  if (!ref) {
    const allHeaders: Record<string, string> = {};
    h.forEach((value, key) => {
      allHeaders[key] = value;
    });

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            padding: "24px 32px",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
            backgroundColor: "white",
            maxWidth: 800,
            width: "100%",
            fontFamily: "monospace",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            DEBUG: no ref from header
          </h1>
          <pre
            style={{
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "#0f172a",
              color: "#e5e7eb",
              padding: 16,
              borderRadius: 12,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {JSON.stringify(allHeaders, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  // ref_code 로 share 찾기
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, title, target_url")
    .eq("ref_code", ref)
    .maybeSingle();

  if (!share || error || !share.target_url) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            padding: "32px 40px",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
            backgroundColor: "white",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            링크를 찾을 수 없습니다
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
            잘못된 링크이거나, 삭제된 링크일 수 있습니다.
          </p>
          <pre
            style={{
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "#0f172a",
              color: "#e5e7eb",
              padding: 12,
              borderRadius: 8,
              maxHeight: 260,
              overflow: "auto",
              textAlign: "left",
            }}
          >
            {JSON.stringify(
              {
                refTried: ref,
                error,
                share,
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    );
  }

  // 조회수 증가
  await supabase.from("r3_hits").insert({ share_id: share.id });

  // User-Agent로 봇/사람 구분
  const ua = (h.get("user-agent") || "").toLowerCase();
  const isBot = /bot|crawl|spider|facebookexternalhit|kakaotalk|kakaolink|kakaolinkscrap|slackbot|telegrambot/.test(
    ua
  );

  if (!isBot) {
    // 사람 → 바로 원본으로 이동
    redirect(share.target_url);
  }

  // 봇/스크래퍼 → 여기 머무르며 메타태그 사용
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #0f172a 0, #020617 45%, #000 100%)",
        color: "#e5e7eb",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          padding: "32px 40px",
          borderRadius: 24,
          backgroundColor: "rgba(15,23,42,0.9)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
          textAlign: "center",
          maxWidth: 640,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#38bdf8",
            marginBottom: 10,
          }}
        >
          R3 · Hand-Forwarded Link
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          원본 페이지로 연결 중입니다…
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8" }}>
          잠시 후 원본 콘텐츠로 이동합니다. 사람 사용자는 자동으로,  
          미리보기 봇은 이 페이지의 썸네일 정보를 사용합니다.
        </p>
      </div>
    </main>
  );
}
