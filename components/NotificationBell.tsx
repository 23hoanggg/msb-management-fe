/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Notification {
  id: string;
  roomId: string;
  roomName: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pos_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3001");

    socket.on("new-order", (data) => {
      const newNotif: Notification = {
        id: Date.now().toString(),
        roomId: data.roomId,
        roomName: data.roomName,
        message: data.message,
        time: new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 50);
        localStorage.setItem("pos_notifications", JSON.stringify(updated));
        return updated;
      });

      toast.success(`Phòng ${data.roomName} đang gọi món!`, {
        description: data.message,
        action: {
          label: "Xem ngay",
          onClick: () => router.push(`/manage-rooms/${data.roomId}`),
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Click ra ngoài để đóng dropdown
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotifClick = (notif: Notification) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, isRead: true } : n,
    );
    setNotifications(updated);
    localStorage.setItem("pos_notifications", JSON.stringify(updated));
    setIsOpen(false);

    router.push(`/manage-rooms/${notif.roomId}`);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("pos_notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("pos_notifications");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* NÚT CHUÔNG */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* DROPDOWN DANH SÁCH THÔNG BÁO */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="font-bold text-base">Thông báo</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-500"
                onClick={markAllAsRead}
                title="Đánh dấu đã đọc tất cả"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500"
                onClick={clearAll}
                title="Xóa tất cả"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Bell className="w-8 h-8 opacity-20 mb-2" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notif.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p
                        className={`text-sm ${!notif.isRead ? "font-bold text-primary" : "font-medium text-foreground"}`}
                      >
                        Phòng {notif.roomName}
                      </p>
                      <span className="text-[10px] flex items-center text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(notif.time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-xs ${!notif.isRead ? "text-foreground font-medium" : "text-muted-foreground"}`}
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
