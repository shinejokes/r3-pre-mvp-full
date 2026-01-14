import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const m1 = url.match(/v=([A-Za-z0-9_-]{11})/);
  if (m1?.[1]) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m2?.[1]) return m2[1];
  return null;
}

function getR3TextColor(forwardCount: number) {
  if (forwardCount >= 100) return "#16a34a"; // green
  if (forwardCount >= 10) return "#2563eb";  // blue
  return "#111827";                          // dark gray (초기에도 보이게)
}

// Edge에서 안전하게 base64 변환
function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        // 일부 CDN이 UA 없으면 막는 경우가 있어 넣어 둠
        "user-agent": "Mozilla/5.0 (compatible; R3OG/1.0)",
        accept: "image/*",
      },
      // Edge fetch는 기본 타임아웃이 없어서 너무 길어질 수 있음 → 짧게 끊자
      // (AbortController는 Edge에서 사용 가능)
      signal: (() => {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 2500);
        return ac.signal;
      })(),
    });

    if (!res.ok) return null;

    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 1000) return null; // 너무 작으면 실패로 간주
    const b64 = arrayBufferToBase64(buf);
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  // shareId가 없거나 DB 문제여도 “항상 이미지”를 반환
  const fallback = (label = "R³") =>
    new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            position: "relative",
            background:
              "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
            fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 48,
              bottom: 48,
              width: 96,
              height: 96,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            {label}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          // 카톡 안정성을 위해 약간 캐시(10분)
          "Cache-Control":
            "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
        },
      }
    );

  if (!shareId) return fallback();

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("original_url, target_url, thumbnail_url, message_id")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error || !data) return fallback();

  const { original_url, target_url, thumbnail_url, message_id } = data as {
    original_url: string | null;
    target_url: string | null;
    thumbnail_url: string | null;
    message_id?: string | null;
  };

  // 1) 썸네일 URL 결정
  let thumbUrl: string | null = null;
  if (thumbnail_url) {
    thumbUrl = thumbnail_url;
  } else {
    const urlForId = target_url || original_url || null;
    const videoId = extractYouTubeId(urlForId);
    if (videoId) thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  // 2) 전체 전달 수(신호)
  let forwardCountForSignal = 1;
  if (message_id) {
    const { count } = await supabase
      .from("r3_shares")
      .select("id", { count: "exact", head: true })
      .eq("message_id", message_id);

    if (typeof count === "number") forwardCountForSignal = Math.max(1, count);
  }

  // 3) 외부 썸네일을 data URL로 고정 (실패 시 fallback 배경)
  const thumbDataUrl = thumbUrl ? await fetchAsDataUrl(thumbUrl) : null;

  // 4) OG 렌더 (프레임 제거 유지: 전체 채움)
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0b172a",
          fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
        }}
      >
        {/* 전체 배경 */}
        {thumbDataUrl ? (
          <img
            src={thumbDataUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle at center, #1f2a3f 0%, #050914 55%, #020308 100%)",
            }}
          />
        )}

        {/* 얕은 어둠막(선택) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.18))",
          }}
        />

        {/* R³ 배지 (그대로) */}
        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 48,
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 800,
            color: getR3TextColor(forwardCountForSignal),
          }}
        >
          R³
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
      },
    }
  );
}

// 카톡이 HEAD로 찌르는 경우도 대비
export async function HEAD(req: NextRequest) {
  return GET(req);
}
