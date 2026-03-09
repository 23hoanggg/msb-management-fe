/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Printer, Search, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReceiptHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Modal In lại Bill
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/room-sessions/history");
      setSessions(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Lỗi tải lịch sử hóa đơn!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (session: any) => {
    setSelectedSession(session);
    setIsReceiptModalOpen(true);
    try {
      setLoadingBill(true);
      const res = await api.get(`/orders/session/${session.id}`);
      setOrderItems(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Lỗi tải chi tiết món!");
    } finally {
      setLoadingBill(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSessions = sessions.filter((s) =>
    s.room.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- TÍNH TOÁN & LẤY DỮ LIỆU TỪ DB CHO BILL IN LẠI ---
  const durationMinutes = selectedSession
    ? Math.ceil(
        (new Date(selectedSession.endTime).getTime() -
          new Date(selectedSession.startTime).getTime()) /
          60000,
      )
    : 0;

  const estimatedRoomFee = selectedSession
    ? Math.round(
        (durationMinutes / 60) * selectedSession.room.roomType.basePrice,
      )
    : 0;

  const servedItems = orderItems.filter((item) => item.status === "SERVED");

  const getAggregatedItems = (items: any[]) => {
    const grouped: Record<string, any> = {};
    items.forEach((item) => {
      if (grouped[item.product.id]) {
        grouped[item.product.id].quantity += item.quantity;
        grouped[item.product.id].totalAmount +=
          item.quantity * item.priceAtTime;
      } else {
        grouped[item.product.id] = {
          ...item,
          totalAmount: item.quantity * item.priceAtTime,
        };
      }
    });
    return Object.values(grouped);
  };
  const aggregatedServedItems = getAggregatedItems(servedItems);

  const totalServiceFee = servedItems.reduce(
    (sum, item) => sum + item.quantity * item.priceAtTime,
    0,
  );

  // 🟢 LẤY SỐ TIỀN TỪ DATABASE (Nếu DB chưa có thì dùng Fallback tính tay cho các bill cũ)
  const dbSubTotal =
    selectedSession?.subTotal || estimatedRoomFee + totalServiceFee;
  const dbDiscountAmount = selectedSession?.discountAmount || 0;
  const dbFinalAmount =
    selectedSession?.finalAmount || estimatedRoomFee + totalServiceFee;

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Ẩn giao diện quản lý khi bấm Ctrl+P */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Lịch sử Hóa đơn
            </h2>
            <p className="text-muted-foreground mt-1">
              Xem lại và in lại hóa đơn cho các ca hát đã thanh toán.
            </p>
          </div>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Danh sách hóa đơn (10 GD gần nhất)
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên phòng..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold pl-6">Mã Giao Dịch</TableHead>
                  <TableHead className="font-bold">Phòng</TableHead>
                  <TableHead className="font-bold">Giờ vào</TableHead>
                  <TableHead className="font-bold">Giờ ra</TableHead>
                  <TableHead className="text-right font-bold">
                    Thực thu
                  </TableHead>
                  <TableHead className="text-right font-bold pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      #{s.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-bold text-primary text-lg">
                      {s.room.name}
                    </TableCell>
                    <TableCell>
                      {new Date(s.startTime).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {new Date(s.endTime).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {/* Hiển thị luôn thực thu ở bảng cho Lễ tân dễ nhìn */}
                      {(s.finalAmount || 0).toLocaleString()}đ
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewReceipt(s)}
                      >
                        <Printer className="w-4 h-4 mr-2" /> Xem & In lại
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Không tìm thấy hóa đơn nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL XEM TRƯỚC HÓA ĐƠN TRÊN MÀN HÌNH */}
        <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-center text-xl uppercase tracking-widest text-primary">
                Chi tiết Hóa đơn
              </DialogTitle>
            </DialogHeader>
            {loadingBill ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Phòng:</span>
                  <span className="font-bold">
                    {selectedSession?.room.name}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Thời gian hát:</span>
                  <span className="font-bold">{durationMinutes} phút</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Tiền phòng:</span>
                  <span className="font-bold">
                    {estimatedRoomFee.toLocaleString()}đ
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Tiền dịch vụ:</span>
                  <span className="font-bold">
                    {totalServiceFee.toLocaleString()}đ
                  </span>
                </div>

                {/* 🟢 NẾU CÓ GIẢM GIÁ THÌ MỚI HIỆN DÒNG NÀY */}
                {dbDiscountAmount > 0 && (
                  <div className="flex justify-between border-b pb-2 text-sm text-green-600">
                    <span className="font-bold">Mã giảm giá áp dụng:</span>
                    <span className="font-bold">
                      - {dbDiscountAmount.toLocaleString()}đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-2 text-lg">
                  <span className="font-black text-foreground">TỔNG CỘNG:</span>
                  <span className="font-black text-red-600">
                    {dbFinalAmount.toLocaleString()}đ
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" /> Phát lệnh In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* GIAO DIỆN MÁY IN NHIỆT (Chỉ hiện khi bấm Ctrl+P)          */}
      {selectedSession && (
        <div className="hidden print:block text-black bg-white w-[80mm] font-mono text-sm mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold uppercase">KARAOKE POS</h2>
            <p className="text-xs">123 Đường ABC, Quận XYZ</p>
            <p className="text-xs">SĐT: 0123.456.789</p>
          </div>

          <div className="text-center mb-4 border-b-2 border-dashed border-black pb-2">
            <h3 className="text-lg font-bold">HÓA ĐƠN BÁN LẺ (IN LẠI)</h3>
            <p className="text-[10px] italic mt-1">
              Mã HĐ: #{selectedSession.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-left mt-3">
              Phòng:{" "}
              <span className="font-bold">{selectedSession.room.name}</span>
            </p>
            <p className="text-xs text-left">
              Giờ vào:{" "}
              {new Date(selectedSession.startTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-left">
              Giờ ra:{" "}
              {new Date(selectedSession.endTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-1 w-[50%]">Tên món</th>
                <th className="text-center py-1 w-[15%]">SL</th>
                <th className="text-right py-1 w-[35%]">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Tiền giờ hát ({durationMinutes}p)</td>
                <td className="text-center py-1">-</td>
                <td className="text-right py-1">
                  {estimatedRoomFee.toLocaleString()}
                </td>
              </tr>
              {aggregatedServedItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1 break-words">{item.product.name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">
                    {item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Tổng cộng:</span>
              <span>{dbSubTotal.toLocaleString()}đ</span>
            </div>

            {/* HIỂN THỊ DÒNG GIẢM GIÁ TRÊN GIẤY IN */}
            {dbDiscountAmount > 0 && (
              <div className="flex justify-between text-xs font-bold">
                <span>Giảm giá:</span>
                <span>- {dbDiscountAmount.toLocaleString()}đ</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold mt-2">
              <span>THỰC THU:</span>
              <span>{dbFinalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="text-center mt-6 text-xs italic">
            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
            <p>Powered by Karaoke POS</p>
          </div>
        </div>
      )}
    </div>
  );
}
