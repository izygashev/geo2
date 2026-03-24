import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем API авторизации
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Пропускаем публичный API (auth проверяется внутри роутов)
  if (pathname.startsWith("/api/reports")) {
    return NextResponse.next();
  }

  // Пропускаем публичные страницы
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Проверяем JWT токен
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
