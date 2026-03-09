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

  // 1. KIỂM TRA BẢO MẬT & LẤY THÔNG TIN USER
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
      <aside className="w-64 border-r bg-card hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <h1 className="text-xl font-bold text-primary tracking-wider">
            Music Box
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <LayoutDashboard className="w-5 h-5" /> Sơ đồ phòng
          </Link>

          <div className="pt-4 pb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3">
              Quản lý
            </p>
          </div>

          <Link
            href="/menu"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <Coffee className="w-5 h-5" /> Thực đơn dịch vụ
          </Link>

          <Link
            href="/room-types"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <Crown className="w-5 h-5" /> Loại phòng hát
          </Link>

          <Link
            href="/manage-rooms"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <DoorOpen className="w-5 h-5" /> Danh sách phòng
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground"
          >
            <ReceiptText className="w-5 h-5" />
            Lịch sử hóa đơn
          </Link>
          <Link
            href="/discounts"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <TicketPercent className="w-5 h-5" /> Khuyến mãi
          </Link>

          <Link
            href="/staff"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <Users className="w-5 h-5" /> Quản lý Nhân sự
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted hover:text-primary transition-colors font-medium"
          >
            <BarChart3 className="w-5 h-5" /> Báo cáo thống kê
          </Link>
        </nav>

        <div className="p-4 border-t shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="font-medium text-lg text-foreground">
            HỆ THỐNG QUẢN LÝ
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-1 text-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground leading-none">
                  {userRole}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
            <NotificationBell />

            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
