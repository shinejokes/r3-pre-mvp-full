// app/r/[...code]/page.tsx
import type { Metadata } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

export const dynamic = "force-dynamic";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
  message_id: string | null; // ✅ 원본 메시지 ID
};

interface PageParams {
  code: string[]; // [...code]라서 배열
}

interface PageProps {
  params: Promise<PageParams>;
}

function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

// ---------- 메타데이터(OG 이미지) ----------
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .maybeSingle<Pick<ShareRow, "title">>();

  const title = data?.title || "R3 Hand-Forwarded Link";

  const base =
    process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

  const ogImageUrl = `${base}/api/ogimage?shareId=${refCode}`;

  return {
    title,
    openGraph: {
      title,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

// ---------- 실제 페이지 ----------
export default async function ShareRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "ref_code, title, target_url, original_url, views, hop, message_id"
    ) // ✅ message_id 추가
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    return (
      <div
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#020617",
          color: "#e5e7eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div>
          <h1>유효하지 않은 링크입니다</h1>
          <p>공유 코드: {refCode}</p>
        </div>
      </div>
    );
  }

  // 1) 클릭 로그: r3_hits에 share_id + message_id 기록
  const hitPayload: { share_id: string; message_id?: string } = {
    share_id: refCode,
  };
  if (data.message_id) {
    hitPayload.message_id = data.message_id;
  }

  const { error: hitError } = await supabase
    .from("r3_hits")
    .insert(hitPayload);

  if (hitError) {
    // 로그만 남기고, 조회수 업데이트/리다이렉트는 계속 진행
    console.error("Failed to insert hit", hitError);
  }

  // 2) 이 공유 링크 자체의 views 컬럼도 +1 (기존 동작 유지)
  const currentViews = data.views ?? 0;

  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: currentViews + 1 })
    .eq("ref_code", refCode);

  const updatedShare: ShareRow = {
    ...data,
    views: updateError ? currentViews : currentViews + 1,
  };

  return <RedirectScreen share={updatedShare} />;
}
:contentReference[oaicite:0]{index=0}

---

## 2️⃣ `/app/api/ogimage/route.ts` – “원본(message_id 기준) 누적 조회수” 표시

변경 포인트  

- `r3_shares`에서 `message_id`도 가져오기  
- `message_id`가 있으면:  
  → `r3_hits`에서 `message_id = ...` 인 row 개수를 **조회수**로 사용  
- `message_id`가 없으면:  
  → 기존 `views` 값(링크별)을 fallback으로 사용  
- 하단 배지에서 `Views {viewsForDisplay}` 로 표기

```ts
// app/api/ogimage/route.ts
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Invalid shareId", { status: 400 });
  }

  // Supabase에서 공유 정보 가져오기
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "title, views, hop, original_url, target_url, thumbnail_url, message_id"
    ) // ✅ message_id 포함
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    return new Response(`Supabase error: ${error.message}`, { status: 500 });
  }
  if (!data) {
    return new Response("Share not found", { status: 404 });
  }

  const {
    title,
    views,
    hop,
    original_url,
    target_url,
    thumbnail_url,
    message_id,
  } = data as {
    title: string | null;
    views: number | null;
    hop: number | null;
    original_url: string | null;
