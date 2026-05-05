/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
  roomType?: {
    name: string;
    basePrice: number;
  };
}

export const useDashboard = () => {
  const router = useRouter();

  // --- 1. STATES ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // --- 2. GỌI API & KẾT NỐI SOCKET ---
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rooms");
      setRooms(
        Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [],
      );
    } catch (error) {
      toast.error("Không thể tải danh sách phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const socket: Socket = io(BACKEND_URL);

    socket.on(
      "room-status-changed",
      (data: {
        roomId: string;
        status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
      }) => {
        setRooms((prev) =>
          prev.map((room) =>
            room.id === data.roomId ? { ...room, status: data.status } : room,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- 3. ACTIONS (XỬ LÝ NGHIỆP VỤ) ---
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCheckIn = async () => {
    if (!selectedRoom) return;
    try {
      setIsCheckingIn(true);
      await api.post("/room-sessions/check-in", { roomId: selectedRoom.id });

      toast.success(`Đã mở phòng ${selectedRoom.name} thành công!`);
      setIsModalOpen(false);

      router.push(`/room/${selectedRoom.id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi mở phòng!",
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  // --- 4. HELPERS (HÀM PHỤ TRỢ UI) ---
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

  return {
    states: { rooms, loading, selectedRoom, isModalOpen, isCheckingIn },
    setters: { setIsModalOpen },
    actions: { handleRoomClick, handleCheckIn },
    helpers: { getStatusColor, getStatusText },
    router,
  };
};
