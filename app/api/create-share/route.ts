import { NextRequest, NextResponse } from "next/server";

// GET 테스트용
export async function GET() {
  return NextResponse.json({
    message: "create-share GET OK (minimal test)",
  });
}

// ✅ POST 최소 테스트용
export async function POST(req: NextRequest) {
  let data = null;
  try {
    data = await req.json();
  } catch (e) {
    // body가 없거나 JSON이 아니면 null
  }

  return NextResponse.json({
    message: "create-share POST OK (minimal test)",
    received: data,
  });
}
