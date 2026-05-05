/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Room {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
}

export const useTvScreen = (urlRoomIdentifier: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. KHỞI TẠO DỮ LIỆU BAN ĐẦU
  useEffect(() => {
    const initializeTv = async () => {
      try {
        setLoading(true);
        const rawUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const BACKEND_URL = rawUrl.replace(/\/$/, "");

        // Gọi API lấy thông tin phòng
        const roomsRes = await fetch(`${BACKEND_URL}/api/rooms`);
        const roomsData = await roomsRes.json();
        const roomsList = roomsData.data || roomsData || [];

        const currentRoom = roomsList.find(
          (r: any) =>
            r.id === urlRoomIdentifier ||
            r.name.toLowerCase() === urlRoomIdentifier.toLowerCase(),
        );

        if (currentRoom) {
          setRoom(currentRoom);
          // Lấy session nếu phòng đang có khách
          const sessionRes = await fetch(
            `${BACKEND_URL}/api/room-sessions/active`,
          );
          const sessionData = await sessionRes.json();
          const sessionsList = sessionData.data || sessionData || [];

          const session = sessionsList.find(
            (s: any) => s.roomId === currentRoom.id,
          );
          setSessionId(session ? session.id : null);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin hệ thống Tivi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (urlRoomIdentifier) initializeTv();
  }, [urlRoomIdentifier]);

  // 2. LẮNG NGHE SOCKET THỜI GIAN THỰC
  useEffect(() => {
    if (!room?.id) return;
    const realRoomId = room.id;

    const rawUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const BACKEND_URL = rawUrl.replace(/\/$/, "");
    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on(
      "room-status-changed",
      (data: { roomId: string; status: string }) => {
        if (data.roomId === realRoomId) {
          setRoom((prev) =>
            prev ? { ...prev, status: data.status as any } : prev,
          );

          if (data.status === "OCCUPIED") {
            setTimeout(async () => {
              try {
                const sessionRes = await fetch(
                  `${BACKEND_URL}/api/room-sessions/active`,
                );
                const sessionData = await sessionRes.json();
                const sessionsList = sessionData.data || sessionData || [];
                const session = sessionsList.find(
                  (s: any) => s.roomId === realRoomId,
                );
                setSessionId(session ? session.id : null);
              } catch (e) {
                console.error("Lỗi tải Session QR:", e);
              }
            }, 1000);
          } else if (data.status === "AVAILABLE") {
            setSessionId(null);
          }
        }
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [room?.id]);

  return {
    states: { room, sessionId, loading },
  };
};
