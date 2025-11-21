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
    .select("title, views, hop, thumbnail_url")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    return new Response(`Supabase error: ${error.message}`, { status: 500 });
  }
  if (!data) {
    return new Response("Share not found", { status: 404 });
  }

  const { title, views, hop, thumbnail_url } = data;
  const thumb = thumbnail_url || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b172a",
          fontFamily: "Pretendard, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* 1) 원본 썸네일 또는 대체 박스 */}
        {thumb ? (
          <img
            src={thumb}
            style={{
              width: "1060px",
              height: "420px",
              objectFit: "cover",
              borderRadius: "24px",
            }}
          />
        ) : (
          <div
            style={{
              width: "1060px",
              height: "420px",
              borderRadius: "24px",
              background:
                "radial-gradient(circle at top, #1f2a3f 0%, #050914 55%, #020308 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8fa3c1",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            R3 HAND-FORWARDED LINK
          </div>
        )}

        {/* 2) 하단 오버레이 박스 (폰트 크게) */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "40px",
            padding: "18px 44px",
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "40px",
            fontSize: "34px",
            fontWeight: 800,
            color: "white",
          }}
        >
          <span style={{ color: "#4aa8ff" }}>R3</span>
          <span>Views {views ?? 0}</span>
          <span>Hop {hop ?? 1}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
