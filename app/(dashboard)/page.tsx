/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Music, Play, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { states, setters, actions, helpers, router } = useDashboard();

  if (states.loading)
    return (
      <div className="p-8 flex justify-center h-[80vh] items-center">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Sơ đồ phòng
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý và giám sát trạng thái phòng hát thời gian thực.
          </p>
        </div>
        <div className="flex gap-4">
          <Badge
            variant="outline"
            className="text-green-600 border-green-600 py-1.5 px-3 bg-green-50"
          >
            <Users className="w-4 h-4 mr-1.5" /> Trống
          </Badge>
          <Badge
            variant="outline"
            className="text-red-600 border-red-600 py-1.5 px-3 bg-red-50"
          >
            <Music className="w-4 h-4 mr-1.5" /> Có khách
          </Badge>
        </div>
      </div>

      {/* DANH SÁCH PHÒNG (LƯỚI) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {states.rooms.map((room) => (
          <Card
            key={room.id}
            className={`cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg border-2 shadow-sm ${helpers.getStatusColor(room.status)}`}
            onClick={() => actions.handleRoomClick(room)}
          >
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-2xl font-black uppercase tracking-wider">
                {room.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <Badge
                className={`px-3 py-1 font-bold ${helpers.getStatusColor(room.status)}`}
                variant="outline"
              >
                {helpers.getStatusText(room.status)}
              </Badge>
              {room.roomType && (
                <p className="text-xs font-semibold opacity-80 uppercase tracking-widest">
                  {room.roomType.name} <br />
                  <span className="text-sm font-black mt-1 inline-block">
                    {room.roomType.basePrice.toLocaleString()}đ/h
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL XÁC NHẬN MỞ PHÒNG HOẶC VÀO PHÒNG */}
      <Dialog open={states.isModalOpen} onOpenChange={setters.setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              Phòng {states.selectedRoom?.name}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {states.selectedRoom?.status === "AVAILABLE"
                ? "Phòng đang trống. Bạn có muốn bắt đầu phiên hát mới?"
                : states.selectedRoom?.status === "OCCUPIED"
                  ? "Phòng đang có khách. Bạn muốn vào màn hình gọi món và thanh toán?"
                  : "Phòng này đang trong quá trình bảo trì."}
            </DialogDescription>
          </DialogHeader>

          {states.selectedRoom?.roomType && (
            <div className="py-4 bg-muted/30 rounded-lg p-4 mt-2 border border-border">
              <div className="flex justify-between border-b border-border/50 pb-2 mb-2">
                <span className="text-muted-foreground font-medium">
                  Loại phòng:
                </span>
                <span className="font-bold uppercase tracking-wider">
                  {states.selectedRoom.roomType.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Giá giờ:
                </span>
                <span className="font-black text-primary text-lg">
                  {states.selectedRoom.roomType.basePrice.toLocaleString()}đ /
                  giờ
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setters.setIsModalOpen(false)}
            >
              Đóng
            </Button>

            {/* NÚT MỞ PHÒNG MỚI */}
            {states.selectedRoom?.status === "AVAILABLE" && (
              <Button
                onClick={actions.handleCheckIn}
                disabled={states.isCheckingIn}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {states.isCheckingIn ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}{" "}
                Mở phòng ngay
              </Button>
            )}

            {/* NÚT VÀO MÀN HÌNH THU NGÂN */}
            {states.selectedRoom?.status === "OCCUPIED" && (
              <Button
                onClick={() => router.push(`/room/${states.selectedRoom?.id}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                Vào phòng thu ngân <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
