// app/api/ogimage2/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

function toDataUrl(contentType: string, bytes: ArrayBuffer) {
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

async function fetchAsDataUrl(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const ct = res.headers.get("content-type") || "image/jpeg";
  const buf = await res.arrayBuffer();
  return toDataUrl(ct, buf);
}

async function fetchLocalPngAsDataUrl(relPath: string) {
  // relPath 예: "../../public/og/r3-black.png"
  const url = new URL(relPath, import.meta.url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`local fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return toDataUrl("image/png", buf);
}

export async function GET(req: Request) {
const { searchParams } = new URL(req.url);

// 1) 파라미터로 thumbUrl이 직접 오면 그걸 최우선 사용
const thumbUrlParam = searchParams.get("thumbUrl");

// 2) thumbUrl이 없으면, shareId로부터 target_url을 읽어 썸네일을 만든다(유튜브만)
const shareId = searchParams.get("shareId") || searchParams.get("shareid") || "";


// 유튜브 ID 추출 함수
function extractYouTubeId(u: string): string | null {
  try {
    const url = new URL(u);

    // youtu.be/<id>
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return id || null;
    }

    // youtube.com/watch?v=<id>
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id || null;
    }

    return null;
  } catch {
    return null;
  }
}

// ✅ 여기서 최종 thumbUrl 결정
let thumbUrl: string | null = thumbUrlParam;

// 아직 DB 연동을 안 붙였다면(오늘은 여기까지만), shareId로는 못 만든다.
// 다음 단계에서 shareId -> target_url(Supabase) 읽는 코드만 추가할 것임.
if (!thumbUrl) {
  // 임시: shareId만 있을 때는 default로
  // (다음에 "shareId로 Supabase 조회해서 target_url 얻기"를 붙이면 됨)
  thumbUrl = null;
}

  // ✅ 2) 배지는 오늘은 검정(기본) 1개만 사용
  // public/og/r3-black.png 를 만들어 둔 상태라고 가정
  const badge = await fetchLocalPngAsDataUrl("../../public/og/r3-black.png");

  let thumbDataUrl: string | null = null;
 let thumbDataUrl: string | null = null;
try {
  if (thumbUrl) thumbDataUrl = await fetchAsDataUrl(thumbUrl);
} catch {
  thumbDataUrl = null;
}


  // ⚠️ 카톡 “0바이트 캐시” 재발 방지: 반드시 no-store
  const headers = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store, max-age=0",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          background: "#000",
        }}
      >
        {/* 배경: 원본 썸네일 (프레임 없이 꽉 채움) */}
        {thumbDataUrl ? (
          <img
            src={thumbDataUrl}
            style={{ width: "1200px", height: "630px", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "1200px", height: "630px", background: "#000" }} />
        )}

        {/* 우하단 R3 배지 (원형, 무테, 밝은 바탕) */}
        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 28,
            width: 104,
            height: 104,
            borderRadius: 999,
            background: "rgba(255,255,255,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={badge} style={{ width: 76, height: 76 }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers }
  );
}
