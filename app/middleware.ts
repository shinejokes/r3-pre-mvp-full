import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/r/:path*"],
};

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isKakao = /Kakao|Kakaotalk|KakaoScrap/i.test(ua);
  const pv = req.nextUrl.searchParams.get("pv");

  if (isKakao || pv === "2") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-r3-preview", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}
