/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef } from "react";
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
import { Loader2, Printer, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useReactToPrint } from "react-to-print";
import ReceiptTemplate from "@/components/ReceiptTemplate";

// IMPORT HOOK LOGIC
import { useHistory } from "@/hooks/useHistory";

export default function ReceiptHistoryPage() {
  const { states, computed, setters, actions } = useHistory();

  // CHUẨN BỊ REF VÀ HÀM IN
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Hoa_Don_${states.selectedSession?.room?.name || "MusicBox"}`,
  });

  if (states.loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER & TÌM KIẾM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Lịch sử Giao dịch
          </h2>
          <p className="text-muted-foreground mt-1">
            Tra cứu hóa đơn và in lại phiếu thanh toán cho khách hàng.
          </p>
        </div>
      </div>

      {/* GIAO DIỆN CHÍNH */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Danh sách hóa đơn (
              {computed.filteredSessions.length})
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên phòng..."
                className="pl-9 bg-background border-input"
                value={states.searchTerm}
                onChange={(e) => setters.setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold pl-6">Phòng</TableHead>
                <TableHead className="font-bold">Giờ ra</TableHead>
                <TableHead className="text-right font-bold">Thực thu</TableHead>
                <TableHead className="text-right font-bold pr-6">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computed.filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không tìm thấy hóa đơn nào.
                  </TableCell>
                </TableRow>
              ) : (
                computed.filteredSessions.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-bold text-primary text-lg">
                      {s.room.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {new Date(s.endTime).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 text-lg">
                      {(s.finalAmount || 0).toLocaleString()}đ
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => actions.handleViewReceipt(s)}
                      >
                        <Printer className="w-4 h-4 mr-2" /> Xem & In lại
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL XEM TRƯỚC TRÊN WEB */}
      <Dialog
        open={states.isReceiptModalOpen}
        onOpenChange={setters.setIsReceiptModalOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Chi tiết Hóa đơn
            </DialogTitle>
          </DialogHeader>
          {states.loadingBill ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : (
            <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Phòng:</span>
                <span className="font-bold text-lg">
                  {states.selectedSession?.room.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tiền phòng:</span>
                <span className="font-bold">
                  {computed.receiptData.estimatedRoomFee.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tiền dịch vụ:</span>
                <span className="font-bold">
                  {computed.receiptData.totalServiceFee.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between pt-2 text-xl">
                <span className="font-black">TỔNG:</span>
                <span className="font-black text-red-600">
                  {computed.receiptData.dbFinalAmount.toLocaleString()}đ
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setters.setIsReceiptModalOpen(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={() => handlePrint()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" /> Phát lệnh In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptTemplate
        ref={componentRef}
        session={states.selectedSession}
        durationMinutes={computed.receiptData.durationMinutes}
        estimatedRoomFee={computed.receiptData.estimatedRoomFee}
        servedItems={computed.receiptData.aggregatedServedItems}
        dbSubTotal={computed.receiptData.dbSubTotal}
        dbDiscountAmount={computed.receiptData.dbDiscountAmount}
        dbFinalAmount={computed.receiptData.dbFinalAmount}
      />
    </div>
  );
}
