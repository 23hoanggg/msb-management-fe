/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
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
import { useReactToPrint } from "react-to-print"; // 🟢 THÊM THƯ VIỆN NÀY

export default function ReceiptHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Modal In lại Bill
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  // 🟢 KHỞI TẠO REF VÀ HÀM IN TỪ REACT-TO-PRINT
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Hoa_Don_In_Lai_${selectedSession?.room?.name || ""}`,
  });

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

  const filteredSessions = sessions.filter((s) =>
    s.room.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- TÍNH TOÁN DỮ LIỆU ---
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
      {/* GIAO DIỆN CHÍNH */}
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
                <TableHead className="text-right font-bold">Thực thu</TableHead>
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
                <span className="font-bold">{selectedSession?.room.name}</span>
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
            {/* GỌI HÀM IN CỦA REACT-TO-PRINT */}
            <Button
              onClick={() => handlePrint()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" /> Phát lệnh In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🟢 KHỐI HÓA ĐƠN ĐỂ IN (ẨN KHỎI MÀN HÌNH BẰNG display: none) */}
      <div style={{ display: "none" }}>
        {selectedSession && (
          <div
            ref={printComponentRef}
            className="text-black bg-white p-4 leading-tight font-mono"
            style={{ width: "80mm" }}
          >
            {/* Header Quán */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold uppercase mb-1">MUSIC BOX</h1>
              <p className="text-xs">Hàm Nghi, Mỹ Đình, Nam Từ Liêm, HN</p>
              <p className="text-xs font-bold mt-1">SĐT: 0123.456.789</p>
            </div>

            {/* Tiêu đề & Thông tin bill */}
            <div className="border-b border-dashed border-black mb-3 pb-3">
              <h2 className="text-center text-lg font-bold mb-1">
                HÓA ĐƠN THANH TOÁN
              </h2>
              <p className="text-center text-[10px] mb-4">(Bản in lại)</p>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Số phiếu:</span>
                  <span>#{selectedSession.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phòng:</span>
                  <span className="font-bold text-sm">
                    {selectedSession.room.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giờ vào:</span>
                  <span>
                    {new Date(selectedSession.startTime).toLocaleString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giờ ra:</span>
                  <span>
                    {new Date(selectedSession.endTime).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left py-2 font-bold w-[45%]">Tên món</th>
                  <th className="text-center py-2 font-bold w-[15%]">SL</th>
                  <th className="text-right py-2 font-bold w-[40%]">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5">Giờ hát ({durationMinutes}p)</td>
                  <td className="text-center py-1.5">-</td>
                  <td className="text-right py-1.5">
                    {estimatedRoomFee.toLocaleString()}
                  </td>
                </tr>
                {aggregatedServedItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1.5 pr-1 break-words">
                      {item.product.name}
                    </td>
                    <td className="text-center py-1.5">{item.quantity}</td>
                    <td className="text-right py-1.5">
                      {item.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tổng tiền */}
            <div className="border-t border-black pt-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span>{dbSubTotal.toLocaleString()}đ</span>
              </div>

              {dbDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Giảm giá:</span>
                  <span>- {dbDiscountAmount.toLocaleString()}đ</span>
                </div>
              )}

              <div className="flex justify-between text-[16px] font-bold mt-2 pt-2 border-t border-dashed border-black">
                <span>THỰC THU:</span>
                <span>{dbFinalAmount.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Footer Lời chào */}
            <div className="text-center mt-6 mb-2 text-xs">
              <p className="italic mb-1">Cảm ơn quý khách!</p>
              <p className="italic">Xin hẹn gặp lại</p>
              <p className="mt-4 text-[9px] text-gray-500 font-sans">
                Powered by Music Box POS
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
