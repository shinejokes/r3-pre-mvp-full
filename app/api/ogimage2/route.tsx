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
// 기본 원본 썸네일 (테스트용 고정값)
const DEFAULT_THUMB =
  "https://i.ytimg.com/vi/16y1AkoZkmQ/hqdefault.jpg";


  // (오늘은 합성만 하기로 했으니 shareId로 DB 조회는 다음 단계)
  // const shareId = searchParams.get("shareId");

const thumbUrl = thumbUrlParam || DEFAULT_THUMB;


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
        overflow: "hidden",
        backgroundColor: "#000", // 썸네일 실패해도 흰색 방지
      }}
    >
      {/* 1) 배경: 원본 썸네일을 "이미지로" 꽉 채움 (backgroundImage 쓰지 말 것) */}
      {thumbDataUrl ? (
        <img
          src={thumbDataUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, #1f2a3f 0%, #050914 55%, #020308 100%)",
          }}
        />
      )}

      {/* (오늘은 합성만이 목표이니, R3 배지/텍스트는 잠깐 빼도 됨) */}
    </div>
  ),
  { width: 1200, height: 630 }
);

}
