// app/api/ogimage2/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Edge 런타임용 base64 변환 (Buffer 금지) */
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 너무 길면 call stack 터질 수 있어서 chunk
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function toDataUrl(contentType: string, bytes: ArrayBuffer) {
  const base64 = arrayBufferToBase64(bytes);
  return `data:${contentType};base64,${base64}`;
}

async function fetchAsDataUrl(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const ct = res.headers.get("content-type") || "image/jpeg";
  const buf = await res.arrayBuffer();
  return toDataUrl(ct, buf);
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);

  // 1) thumbUrl이 오면 그걸 그대로 배경으로 사용
  const thumbUrlParam = searchParams.get("thumbUrl");

  // (오늘은 합성만 하기로 했으니 shareId로 DB 조회는 다음 단계)
  // const shareId = searchParams.get("shareId");

  const thumbUrl = thumbUrlParam || null;

  // 배지: public/og/r3-black.png 를 “웹 경로”로 fetch (Edge 안전)
  // ✅ public 폴더는 배포 후에도 /og/... 로 접근 가능
  const badgeUrl = `${origin}/og/r3-black.png`;
  let badgeDataUrl: string | null = null;
  try {
    badgeDataUrl = await fetchAsDataUrl(badgeUrl);
  } catch {
    badgeDataUrl = null;
  }

  // 배경 썸네일
  let thumbDataUrl: string | null = null;
  try {
    if (thumbUrl) thumbDataUrl = await fetchAsDataUrl(thumbUrl);
  } catch {
    thumbDataUrl = null;
  }

  // ⚠️ 카톡 “0바이트 캐시” 재발 방지: no-store 고정
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
            background: "rgba(255,255,255,0.60)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badgeDataUrl ? (
            <img src={badgeDataUrl} style={{ width: 76, height: 76 }} />
          ) : (
            // 배지 로드 실패 시, 임시 텍스트(디버그용)
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>R³</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers }
  );
}
