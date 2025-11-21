import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 🔹 Supabase에서 데이터 읽기
  const supabase = supabaseServer();
  const { data: shareData } = await supabase
    .from("r3_shares")
    .select("title, views, hop, thumbnail_url")
    .eq("ref_code", shareId)
    .single();

  if (!shareData) {
    return new Response("Invalid shareId", { status: 404 });
  }

  const { title, views, hop, thumbnail_url } = shareData;

  // 🔹 OG 이미지 렌더링
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b172a",
          fontFamily: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative",
        }}
      >
        {/* ▶ 상단 라벨은 모바일에서 너무 커서 제거 */}

        {/* ▶ 제목 (조금 더 작게: 34px) */}
        <div
          style={{
            fontSize: "34px",
            fontWeight: 600,
            color: "white",
            paddingTop: "50px",
            paddingLeft: "70px",
          }}
        >
          {title}
        </div>

        {/* ▶ 원본 썸네일 */}
        <img
          src={thumbnail_url}
          style={{
            width: "1060px",
            height: "420px",
            margin: "40px auto 0 auto",
            objectFit: "cover",
            borderRadius: "24px",
          }}
        />

        {/* ▶ 아래 R3 박스 (폰트 크게 + 고대비, 모바일에서 잘 보이도록) */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "40px",                 // 아이템 사이 간격
            padding: "16px 40px",        // 박스 크기 키우기
            background: "rgba(0, 0, 0, 0.45)", // 배경을 조금 더 진하게
            borderRadius: "40px",
            fontSize: "30px",            // 🔥 핵심: 글자 크게
            fontWeight: 800,             // 🔥 더 두껍게
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
