/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  roomId: string;
  roomName: string;
  message: string;
  time: string;
  isRead: boolean;
}

const playNotificationSound = () => {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAADp/1H/wf4S/rn9I/0K/Tj8xvtz+yT7+vrr+k/6Efo0+mn6yPod+877cvyZ/WT+P/8dAA0BRQJqA2MEWgUjBpAGrQa3BngGTgXoAw4CKgDq/gD+Vv0C/c77dvuS+kP61PnF+Wj5N/lM+Y359vk1+oD69fox+5j7/Psn/Gv8zPwz/Xn9yP0n/m3+rP7v/jD/XP9z/4P/i/+T/5f/oP+m/7T/xP/S/9z/6f/1//z/AAAPAB0ALwA6AEYATABVAHMAfgCQAKgA",
    );
    audio.play();
  } catch (e) {
    console.log("Trình duyệt chặn autoplay");
  }
};

export default function NotificationBell() {
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🟢 Bộ chặn SPAM (Tránh kêu Ting ting 3 lần khi dùng Promise.all)
  const lastSoundPlayedRef = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("msb_notifications_v3");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const rawUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const BACKEND_URL = rawUrl.replace(/\/$/, "");

    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("new-order", (data: any) => {
      const now = Date.now();
      const roomId = data?.roomId || "";
      const roomName = data?.roomName || "Khách";
      const message = data?.message || "Khách hàng vừa lên đơn mới.";

      // 🟢 Nếu cách lần kêu cuối cùng hơn 1.5 giây thì mới kêu tiếp (Chống spam)
      if (now - lastSoundPlayedRef.current > 1500) {
        playNotificationSound();
        toast.success(`Phòng ${roomName} đang gọi món!`, {
          description: "Có đơn mới được gửi lên hệ thống.",
          duration: 8000,
          action: roomId
            ? {
                label: "Xem ngay",
                onClick: () => router.push(`/manage-rooms/${roomId}`),
              }
            : undefined,
        });
        lastSoundPlayedRef.current = now;
      }

      // Vẫn lưu vào danh sách chuông đầy đủ
      const newNotif: NotificationItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        roomId: roomId,
        roomName: roomName,
        message: message,
        time: new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 50);
        localStorage.setItem("msb_notifications_v3", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isMounted, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = (notif: NotificationItem) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, isRead: true } : n,
    );
    setNotifications(updated);
    localStorage.setItem("msb_notifications_v3", JSON.stringify(updated));
    setIsOpen(false);
    if (notif.roomId) router.push(`/manage-rooms/${notif.roomId}`);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("msb_notifications_v3", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("msb_notifications_v3");
  };

  if (!isMounted) return <div className="w-9 h-9" />;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-muted transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="font-bold text-base text-foreground">Thông báo</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-500 hover:bg-blue-50"
                onClick={markAllAsRead}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:bg-red-50"
                onClick={clearAll}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Bell className="w-10 h-10 opacity-20 mb-3" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/60 ${!notif.isRead ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p
                        className={`text-sm ${!notif.isRead ? "font-bold text-primary" : "font-semibold text-foreground"}`}
                      >
                        Phòng {notif.roomName}
                      </p>
                      <span className="text-[10px] flex items-center text-muted-foreground whitespace-nowrap ml-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(notif.time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${!notif.isRead ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
