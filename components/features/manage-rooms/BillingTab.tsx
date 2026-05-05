/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, CreditCard } from "lucide-react";

interface BillingTabProps {
  session: any;
  durationMinutes: number;
  estimatedRoomFee: number;
  aggregatedServedItems: any[];
  aggregatedPendingItems: any[];
  pendingItemsCount: number;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  appliedDiscount: any;
  setAppliedDiscount: (val: any) => void;
  discountAmount: number;
  finalAmount: number;
  isVerifyingDiscount: boolean;
  isProcessing: boolean;
  onVerifyDiscount: () => void;
  onCheckout: () => void;
}

export default function BillingTab({
  session,
  durationMinutes,
  estimatedRoomFee,
  aggregatedServedItems,
  aggregatedPendingItems,
  pendingItemsCount,
  discountCode,
  setDiscountCode,
  appliedDiscount,
  setAppliedDiscount,
  discountAmount,
  finalAmount,
  isVerifyingDiscount,
  isProcessing,
  onVerifyDiscount,
  onCheckout,
}: BillingTabProps) {
  return (
    <div className="max-w-2xl w-full mx-auto h-full flex flex-col pb-2 min-h-0">
      {pendingItemsCount > 0 && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center gap-3 font-medium border border-red-200 shrink-0">
          <AlertTriangle className="w-5 h-5" />
          Vẫn còn món CẦN GIAO NGAY. Khách hàng chưa nhận đủ đồ, không thể chốt
          hóa đơn!
        </div>
      )}

      <Card className="flex-1 flex flex-col min-h-0 shadow-xl border-primary/20">
        <CardHeader className="bg-muted/50 text-center border-b pb-4 shrink-0">
          <CardTitle className="text-2xl uppercase text-primary tracking-widest">
            Hóa đơn thanh toán
          </CardTitle>
          <p className="text-muted-foreground">
            {session?.room?.name} - {new Date().toLocaleDateString("vi-VN")}
          </p>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <p className="font-bold text-lg text-foreground">
                  Tiền giờ hát
                </p>
                <p className="text-sm text-muted-foreground">
                  {durationMinutes} phút x{" "}
                  {session?.room.roomType.basePrice.toLocaleString()}đ/h
                </p>
              </div>
              <p className="font-bold text-xl text-foreground">
                {estimatedRoomFee.toLocaleString()}đ
              </p>
            </div>

            <div>
              <p className="font-bold text-lg mb-3 text-foreground">
                Tiền dịch vụ
              </p>
              {aggregatedServedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-dashed border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {item.priceAtTime.toLocaleString()}đ
                    </p>
                  </div>
                  <p className="font-semibold text-lg text-foreground">
                    {item.totalAmount.toLocaleString()}đ
                  </p>
                </div>
              ))}
              {aggregatedPendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-dashed border-border opacity-50 text-red-500"
                >
                  <div>
                    <p className="font-medium">
                      {item.product.name} (Chưa giao)
                    </p>
                    <p className="text-sm">
                      {item.quantity} x {item.priceAtTime.toLocaleString()}đ
                    </p>
                  </div>
                  <p className="font-semibold text-lg">
                    {item.totalAmount.toLocaleString()}đ
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-3">
              <label className="text-sm font-bold text-foreground">
                Mã giảm giá (Nếu có):
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="VD: LE304"
                  value={discountCode}
                  className="bg-background text-foreground"
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setAppliedDiscount(null);
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={onVerifyDiscount}
                  disabled={isVerifyingDiscount || !discountCode}
                >
                  {isVerifyingDiscount ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Áp dụng"
                  )}
                </Button>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between items-center text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <span className="font-bold">
                    Giảm giá ({appliedDiscount.percent}%):
                  </span>
                  <span className="font-bold text-xl">
                    - {discountAmount.toLocaleString()}đ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border rounded-b-xl space-y-4 shrink-0">
          <div className="flex justify-between items-center text-2xl font-black text-foreground">
            <span>KHÁCH PHẢI TRẢ:</span>
            <span className="text-red-600 text-3xl">
              {finalAmount.toLocaleString()}đ
            </span>
          </div>
          <Button
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 uppercase tracking-wider"
            onClick={onCheckout}
            disabled={isProcessing || pendingItemsCount > 0}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-6 h-6 mr-2" />
            )}
            Chốt & In Hóa Đơn
          </Button>
        </div>
      </Card>
    </div>
  );
}
