import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: shareData, error } = await supabase
    .from("r3_shares")
    .select("title, views, hop, thumbnail_url")
    .eq("ref_code", shareId)
    .maybeSingle(); // row가 없으면 null, 있으면 1개

  // ✅ 1) Supabase 오류를 그대로 보여 주기 (진단용)
  if (error) {
    return new Response(
      `Supabase error: ${error.message}`,
      { status: 500 }
    );
  }

  // ✅ 2) 행이 없는 경우는 진짜로 shareId가 잘못된 경우
  if (!shareData) {
    return new Response(
      `Invalid shareId: ${shareId}`,
      { status: 404 }
    );
  }

  const { title, views, hop, thumbnail_url } = shareData;

  // ✅ 3) 썸네일 이미지 렌더링 (위쪽 텍스트 없이, 아래 R3/Views/Hop 크게)
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
          fontFamily: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative",
        }}
      >
        {/* 원본 썸네일 */}
        <img
          src={thumbnail_url}
          style={{
            width: "1060px",
            height: "420px",
            objectFit: "cover",
            borderRadius: "24px",
          }}
        />

        {/* 하단 R3 · Views · Hop 박스 (폰트 크게) */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "40px",
            padding: "16px 40px",
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "40px",
            fontSize: "30px",
            fontWeight: 800,
            color: "white",
          }}
        >
          <span style={{ color: "#4aa8ff" }}>R3</span>
          <span>Views {views}</span>
          <span>Hop {hop}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
