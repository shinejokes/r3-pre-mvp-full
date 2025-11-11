// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/r/:path*"], // /r/* 만 감지
};

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isKakao = /Kakao|Kakaotalk|KakaoScrap/i.test(ua);
  const pv = req.nextUrl.searchParams.get("pv");

  // KakaoScrap 또는 ?pv=2 이면 프리뷰 모드 강제
  if (isKakao || pv === "2") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-r3-preview", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}
