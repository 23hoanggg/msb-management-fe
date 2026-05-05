import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Lấy thẻ Token từ Cookie của trình duyệt
  const token = request.cookies.get("token")?.value;

  // Lấy đường dẫn người dùng đang muốn vào (VD: /staff, /manage-rooms...)
  const { pathname } = request.nextUrl;

  // 1. Nếu CHƯA ĐĂNG NHẬP (Không có token)
  if (!token) {
    // Cho phép vào trang /login, API, hoặc trang của Khách hàng (/customer)
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/customer") ||
      pathname.startsWith("/api")
    ) {
      return NextResponse.next();
    }
    // Nếu cố tình vào Dashboard -> Đá về trang /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Nếu ĐÃ ĐĂNG NHẬP (Có token)
  if (token) {
    // Lại cố tình quay lại trang /login -> Đá ngược vào Dashboard (Trang chủ)
    if (pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Hợp lệ, cho phép đi tiếp
  return NextResponse.next();
}

// Cấu hình Middleware này chỉ chạy trên những đường dẫn nào?
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các đường dẫn, NGOẠI TRỪ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
