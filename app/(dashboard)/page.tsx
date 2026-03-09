/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Music, Play, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Room {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
  roomType?: {
    name: string;
    basePrice: number;
  };
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      if (res.data && Array.isArray(res.data.data)) {
        setRooms(res.data.data);
      } else if (Array.isArray(res.data)) {
        setRooms(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách phòng:", error);
      toast.error("Không thể tải danh sách phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    const socket: Socket = io(BACKEND_URL);
    socket.on(
      "room-status-changed",
      (data: {
        roomId: string;
        status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
      }) => {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === data.roomId ? { ...room, status: data.status } : room,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCheckIn = async () => {
    if (!selectedRoom) return;

    try {
      setIsCheckingIn(true);
      await api.post("/room-sessions/check-in", {
        roomId: selectedRoom.id,
      });

      toast.success(`Đã mở phòng ${selectedRoom.name} thành công!`);
      setIsModalOpen(false);

      router.push(`/manage-rooms/${selectedRoom.id}`);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Có lỗi xảy ra khi mở phòng!";
      toast.error(errorMsg);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/10 text-green-500 border-green-500 hover:bg-green-500/20";
      case "OCCUPIED":
        return "bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500 hover:bg-gray-500/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Trống";
      case "OCCUPIED":
        return "Có khách";
      default:
        return "Bảo trì";
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý phòng
          </h2>
          <p className="text-muted-foreground mt-1">
            {" "}
            Danh sách và trạng thái các phòng
          </p>
        </div>
        <div className="flex gap-4">
          <Badge
            variant="outline"
            className="text-green-500 border-green-500 py-1"
          >
            <Users className="w-3 h-3 mr-1" /> Trống
          </Badge>
          <Badge
            variant="outline"
            className="text-destructive border-destructive py-1"
          >
            <Music className="w-3 h-3 mr-1" /> Có khách
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {rooms.map((room) => (
          <Card
            key={room.id}
            className={`cursor-pointer transition-all hover:scale-105 border-2 shadow-sm ${getStatusColor(room.status)}`}
            onClick={() => handleRoomClick(room)}
          >
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-xl font-bold uppercase">
                {room.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Badge className={getStatusColor(room.status)} variant="outline">
                {getStatusText(room.status)}
              </Badge>
              {room.roomType && (
                <p className="text-sm font-medium opacity-80">
                  {room.roomType.name} -{" "}
                  {room.roomType.basePrice.toLocaleString()}đ/h
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL XÁC NHẬN MỞ PHÒNG HOẶC VÀO PHÒNG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Phòng {selectedRoom?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRoom?.status === "AVAILABLE"
                ? "Phòng đang trống. Bạn có muốn bắt đầu phiên hát mới?"
                : selectedRoom?.status === "OCCUPIED"
                  ? "Phòng đang có khách. Bạn muốn vào màn hình gọi món và thanh toán?"
                  : "Phòng này đang trong quá trình bảo trì."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedRoom?.roomType && (
              <div className="flex justify-between border-b pb-2 mb-2">
                <span className="text-muted-foreground">Loại phòng:</span>
                <span className="font-medium">
                  {selectedRoom.roomType.name}
                </span>
              </div>
            )}
            {selectedRoom?.roomType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá giờ:</span>
                <span className="font-medium text-primary">
                  {selectedRoom.roomType.basePrice.toLocaleString()}đ / giờ
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Đóng
            </Button>

            {/* NÚT MỞ PHÒNG MỚI */}
            {selectedRoom?.status === "AVAILABLE" && (
              <Button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Mở phòng ngay
              </Button>
            )}

            {selectedRoom?.status === "OCCUPIED" && (
              <Button
                onClick={() => router.push(`/manage-rooms/${selectedRoom.id}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Vào phòng / Lấy mã QR <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
