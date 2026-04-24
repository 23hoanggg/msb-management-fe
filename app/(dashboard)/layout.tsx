/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Coffee,
  Crown,
  DoorOpen,
  TicketPercent,
  BarChart3,
  Users,
  LogOut,
  Loader2,
  UserCircle,
  ReceiptText,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import NotificationBell from "@/components/NotificationBell";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// Tạo mảng chứa các Link để render tự động
const NAV_LINKS = [
  { href: "/", label: "Sơ đồ phòng", icon: LayoutDashboard },
  { isDivider: true, label: "Quản lý" },
  { href: "/menu", label: "Thực đơn dịch vụ", icon: Coffee },
  { href: "/room-types", label: "Loại phòng hát", icon: Crown },
  { href: "/manage-rooms", label: "Danh sách phòng", icon: DoorOpen },
  { href: "/history", label: "Lịch sử hóa đơn", icon: ReceiptText },
  { href: "/discounts", label: "Khuyến mãi", icon: TicketPercent },
  { href: "/staff", label: "Quản lý Nhân sự", icon: Users },
  { href: "/reports", label: "Báo cáo thống kê", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState<string>("Nhân viên");
  const [userRole, setUserRole] = useState<string>("");

  // KIỂM TRA BẢO MẬT & LẤY THÔNG TIN USER
  useEffect(() => {
    setIsMounted(true);

    const token = getCookie("token");

    if (!token) {
      window.location.href = "/login";
    } else {
      setIsAuthorized(true);

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserName(
            parsedUser.fullName || parsedUser.username || "Nhân viên",
          );
          setUserRole(parsedUser.role === "ADMIN" ? "Quản lý" : "Lễ tân");
        }
      } catch (error) {
        console.error("Lỗi đọc thông tin user", error);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    deleteCookie("token");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  if (!isMounted) return null;

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-2 font-medium text-muted-foreground">
          Đang xác thực thông tin...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col shrink-0 z-20 shadow-sm">
        {/*Bấm vào Logo nhảy về trang chủ */}
        <Link
          href="/"
          className="h-16 flex items-center px-6 border-b shrink-0 hover:bg-muted/50 transition-colors group cursor-pointer"
        >
          <h1 className="text-xl font-bold text-primary tracking-wider group-hover:scale-105 transition-transform duration-300">
            Music Box
          </h1>
        </Link>

        {/* MENU RENDER TỰ ĐỘNG */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAV_LINKS.map((item, index) => {
            // Hiển thị dải phân cách (Divider)
            if (item.isDivider) {
              return (
                <div key={`divider-${index}`} className="pt-4 pb-1">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-3">
                    {item.label}
                  </p>
                </div>
              );
            }

            //  Logic xác định tab đang active
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href as string));

            const Icon = item.icon!;

            return (
              <Link
                key={item.href}
                href={item.href as string}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm" // Nổi bật mục đang chọn
                    : "text-muted-foreground hover:bg-muted hover:text-foreground" // Mục bình thường
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* NÚT ĐĂNG XUẤT */}
        <div className="p-4 border-t shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH (RIGHT SIDE) */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="font-medium text-lg text-foreground tracking-wide">
            HỆ THỐNG QUẢN LÝ
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-1 text-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground leading-none font-medium">
                  {userRole}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>

            {/*Chuông thông báo Real-time */}
            <NotificationBell />

            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
