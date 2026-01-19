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
  const shareId = searchParams.get("shareId") || "";

  // ✅ 1) 원본 썸네일 URL을 “임시로” query로 받자네 (오늘은 합성만 목표)
  // 예: /api/ogimage2?thumb=https://...jpg
  const thumb = searchParams.get("thumb") || "";
  // ✅ 2) 배지는 오늘은 검정(기본) 1개만 사용
  // public/og/r3-black.png 를 만들어 둔 상태라고 가정
  const badge = await fetchLocalPngAsDataUrl("../../public/og/r3-black.png");

  let thumbDataUrl: string | null = null;
  try {
    if (thumb) thumbDataUrl = await fetchAsDataUrl(thumb);
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
