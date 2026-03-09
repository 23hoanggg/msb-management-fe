/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { Mic2, Sparkles, Wrench, Music4 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
}

export default function TvScreenPage() {
  const params = useParams();
  const urlRoomIdentifier = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeTv = async () => {
      try {
        const rawUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const BACKEND_URL = rawUrl.replace(/\/$/, "");

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
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
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
      }
    };

    initializeTv();
  }, [urlRoomIdentifier]);

  useEffect(() => {
    if (!room?.id) return;
    const realRoomId = room.id;

    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const socket: Socket = io(BACKEND_URL);

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
                const BACKEND_URL =
                  process.env.NEXT_PUBLIC_BACKEND_URL ||
                  "http://localhost:3001";
                const sessionRes = await fetch(
                  `${BACKEND_URL}/api/room-sessions/active`,
                );
                const sessionData = await sessionRes.json();
                const sessionsList = sessionData.data || sessionData || [];
                const session = sessionsList.find(
                  (s: any) => s.roomId === realRoomId,
                );
                setSessionId(session ? session.id : null);
              } catch (e) {}
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

  if (!room) {
    return (
      <div className="h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center font-sans">
        <Mic2 className="w-16 h-16 mb-4 animate-bounce text-purple-500" />
        <p className="text-2xl animate-pulse">
          Đang kết nối hệ thống Music Box...
        </p>
        <p className="text-sm mt-2">Đang tải dữ liệu phòng hát...</p>
      </div>
    );
  }

  // GIAO DIỆN TIVI
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white flex flex-col font-sans relative selection:bg-transparent">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-12 py-8 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-xl">
            <Mic2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              MUSIC BOX
            </h1>
            <p className="text-sm text-slate-400 uppercase tracking-[0.3em] mt-1">
              Hệ thống giải trí cao cấp
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black tracking-wider uppercase">
            {room.name}
          </h2>
        </div>
      </div>

      {/* Nội dung chính giữa Tivi */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-12">
        {room.status === "OCCUPIED" && sessionId ? (
          <div className="flex w-full max-w-5xl bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-700">
            <div className="flex-1 p-12 flex flex-col justify-center border-r border-white/10">
              <span className="w-fit bg-green-500/20 text-green-400 border border-green-500/30 text-lg px-4 py-1 mb-6 rounded-full font-bold">
                Phòng đang sử dụng
              </span>
              <h3 className="text-5xl font-black leading-tight mb-6">
                Quét mã QR để <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  gọi món tại bàn
                </span>
              </h3>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Sử dụng Camera điện thoại hoặc Zalo quét mã bên phải để xem thực
                đơn và gọi đồ uống. Lễ tân sẽ mang lên ngay!
              </p>
              <div className="flex items-center gap-3 text-slate-300 bg-white/5 w-fit px-6 py-3 rounded-full">
                <Music4 className="w-5 h-5 text-purple-400" />
                <span>
                  Chúc quý khách có những giây phút thư giãn tuyệt vời
                </span>
              </div>
            </div>

            <div className="w-[450px] bg-white flex flex-col items-center justify-center p-10">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/customer/order/${sessionId}`}
                  size={300}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
              <p className="text-slate-800 font-bold mt-8 text-xl tracking-wide uppercase">
                Quét để gọi món
              </p>
            </div>
          </div>
        ) : room.status === "AVAILABLE" ? (
          <div className="text-center animate-in fade-in duration-1000 flex flex-col items-center">
            <div className="w-40 h-40 bg-purple-500/10 rounded-full flex items-center justify-center mb-8 border border-purple-500/20">
              <Sparkles className="w-20 h-20 text-purple-400 animate-pulse" />
            </div>
            <h2 className="text-6xl font-black mb-6 tracking-tight">
              Kính chào quý khách
            </h2>
            <p className="text-2xl text-slate-400">
              Phòng đang sẵn sàng, vui lòng liên hệ Lễ tân để bắt đầu sử dụng.
            </p>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center">
            <div className="w-40 h-40 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20">
              <Wrench className="w-20 h-20 text-orange-400" />
            </div>
            <h2 className="text-6xl font-black mb-6 tracking-tight">
              Phòng đang bảo trì
            </h2>
            <p className="text-2xl text-slate-400">
              Chúng tôi đang nâng cấp thiết bị. Xin vui lòng sử dụng phòng khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
