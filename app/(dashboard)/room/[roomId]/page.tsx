/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import api from "@/lib/api";

import ServiceTab from "@/components/features/manage-rooms/ServiceTab";
import BillingTab from "@/components/features/manage-rooms/BillingTab";
import ReceiptTemplate from "@/components/ReceiptTemplate";
import { useRoomDetail } from "@/hooks/useRoomDetail";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { states, computed, actions, setters } = useRoomDetail(roomId);

  const [showReceipt, setShowReceipt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const handleCheckout = async () => {
    if (!states.session) return;
    if (computed.pendingItems.length > 0)
      return toast.error("Vẫn còn món CẦN GIAO NGAY!");

    try {
      if (setters?.setIsProcessing) setters.setIsProcessing(true);

      const res = await api.post(
        `/room-sessions/check-out/${states.session.id}`,
        {
          discountCode: states.appliedDiscount
            ? states.discountCode
            : undefined,
        },
      );

      const updatedSession = res.data?.data || res.data;

      const guaranteedSession = {
        ...states.session,
        ...updatedSession,
        endTime: updatedSession?.endTime || new Date().toISOString(),
      };

      if (setters?.setSession) {
        setters.setSession(guaranteedSession);
      }

      toast.success("Thanh toán thành công! Chuẩn bị in hóa đơn.");
      setShowReceipt(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi thanh toán!");
    } finally {
      if (setters?.setIsProcessing) setters.setIsProcessing(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Hoa_Don_${states.session?.room?.name || "Karaoke"}`,
    onAfterPrint: () => {
      setShowReceipt(false);
      router.push("/");
    },
  });

  const handleFinish = () => {
    setShowReceipt(false);
    router.push("/");
  };

  if (states.loading)
    return (
      <div className="p-8 flex justify-center h-screen items-center">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
        {/* HEADER CHI TIẾT PHÒNG */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Chi tiết phòng {states.session?.room?.name || roomId}
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Đang hát: {computed.durationMinutes} phút
              </p>
            </div>
          </div>
          {states.session && (
            <Button
              onClick={() => setShowQrModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md font-bold"
            >
              <QrCode className="w-5 h-5 mr-2" /> Mã QR Gọi Món
            </Button>
          )}
        </div>

        {/* KHU VỰC TABS */}
        <Tabs
          defaultValue="service"
          className="flex-1 flex flex-col overflow-hidden min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-[500px] mb-4 h-12 shrink-0">
            <TabsTrigger value="service" className="text-base font-semibold">
              🛒 Phục vụ & Gọi món
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="text-base font-semibold relative"
            >
              💰 Thanh toán
              {computed.pendingItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="service"
            className="flex-1 data-[state=active]:flex flex-col min-h-0 overflow-hidden m-0"
          >
            <ServiceTab
              products={states.products}
              pendingItems={computed.pendingItems}
              servedItems={computed.servedItems}
              totalServiceFee={computed.totalServiceFee}
              onAddOrder={actions.handleAddOrder}
              onReduceOrder={actions.handleReduceOrder}
              onCustomQuantity={actions.handleCustomQuantity}
              onServeAll={actions.handleServeAll}
            />
          </TabsContent>

          <TabsContent
            value="billing"
            className="flex-1 data-[state=active]:flex flex-col min-h-0 overflow-hidden m-0"
          >
            <BillingTab
              session={states.session}
              durationMinutes={computed.durationMinutes}
              estimatedRoomFee={computed.estimatedRoomFee}
              aggregatedServedItems={computed.aggregatedServedItems}
              aggregatedPendingItems={computed.aggregatedPendingItems}
              pendingItemsCount={computed.pendingItems.length}
              discountCode={states.discountCode}
              appliedDiscount={states.appliedDiscount}
              setDiscountCode={setters?.setDiscountCode}
              setAppliedDiscount={setters?.setAppliedDiscount}
              discountAmount={computed.discountAmount}
              finalAmount={computed.finalAmount}
              isVerifyingDiscount={states.isVerifyingDiscount}
              isProcessing={states.isProcessing}
              onVerifyDiscount={actions.handleVerifyDiscount}
              onCheckout={handleCheckout}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* --- CÁC MODAL --- */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-primary uppercase font-bold">
              QR Gọi Món Khách Hàng
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <QRCodeSVG
              value={`${window.location.origin}/customer/order/${states.session?.id}`}
              size={220}
              level={"H"}
              includeMargin={true}
            />
            <p className="mt-4 font-black text-gray-800 text-2xl">
              Phòng {states.session?.room?.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showReceipt}
        onOpenChange={(open) => {
          if (!open) handleFinish();
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-6 bg-white border-none shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">
              Xác nhận In Hóa Đơn
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <Button variant="outline" onClick={handleFinish}>
              Bỏ qua
            </Button>
            <Button
              onClick={() => handlePrint()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Printer className="w-4 h-4 mr-2" /> In Hóa Đơn
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* COMPONENT IN HÓA ĐƠN */}
      <ReceiptTemplate
        ref={componentRef}
        session={states.session}
        durationMinutes={computed.durationMinutes}
        estimatedRoomFee={computed.estimatedRoomFee}
        servedItems={computed.aggregatedServedItems}
        dbSubTotal={
          computed.subTotal ||
          computed.estimatedRoomFee + computed.totalServiceFee
        }
        dbDiscountAmount={computed.discountAmount}
        dbFinalAmount={computed.finalAmount}
      />
    </>
  );
}
