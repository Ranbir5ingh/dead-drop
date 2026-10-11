import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/hide", "/hunt", "/leaderboard", "/drop"];

function isProtected(pathname: string): boolean {
  return PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();
  if (request.cookies.get("dd_refresh")?.value) return NextResponse.next();
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/hide/:path*", "/hunt/:path*", "/leaderboard/:path*", "/drop/:path*"],
};
