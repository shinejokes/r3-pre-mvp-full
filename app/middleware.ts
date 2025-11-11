// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  // /r/ 경로만 감지
  matcher: ["/r/:path*"],
};

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isKakao = /Kakao|Kakaotalk|KakaoScrap/i.test(ua);
  const pv = req.nextUrl.searchParams.get("pv");

  // KakaoScrap이거나 ?pv=2 로 오면 프리뷰 모드 헤더 주입
  if (isKakao || pv === "2") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-r3-preview", "1"); // 페이지/metadata에서 읽어 사용
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}
