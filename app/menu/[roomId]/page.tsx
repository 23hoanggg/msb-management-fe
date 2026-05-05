/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Plus,
  Minus,
  Loader2,
  Music,
  CheckCircle2,
} from "lucide-react";

import { useCustomerMenu } from "@/hooks/useCustomerMenu";

export default function CustomerMenuPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  // Gọi hook
  const { states, computed, setters, actions } = useCustomerMenu(roomId);

  // --- MÀN HÌNH CHỜ / LỖI CHƯA MỞ PHÒNG ---
  if (states.loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  if (!states.sessionId) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-6 text-center space-y-4 bg-muted/30">
        <Music className="w-20 h-20 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Phòng đang trống</h1>
        <p className="text-muted-foreground">
          Vui lòng liên hệ Lễ tân để mở phòng trước khi quét mã gọi món nhé!
        </p>
      </div>
    );
  }

  // --- MÀN HÌNH CHÍNH QUÉT MÃ ---
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative pb-24 shadow-2xl">
      {/* HEADER TÊN PHÒNG */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-[2rem] shadow-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center">Karaoke Box</h1>
        <p className="text-center text-primary-foreground/80">
          Bạn đang ở phòng:{" "}
          <strong className="text-white text-lg">{roomId}</strong>
        </p>
      </div>

      {/* DANH SÁCH MENU */}
      <div className="p-4 space-y-6">
        <h2 className="font-bold text-xl text-gray-800">Thực đơn hôm nay</h2>
        <div className="grid grid-cols-2 gap-4">
          {states.products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border-none shadow-sm bg-white rounded-2xl"
            >
              <CardContent className="p-0">
                <div className="h-32 bg-gray-100 flex items-center justify-center text-5xl">
                  {product.name.toLowerCase().includes("bia")
                    ? "🍺"
                    : product.name.toLowerCase().includes("nước")
                      ? "🥤"
                      : "🍉"}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold line-clamp-1 text-gray-800 text-sm">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold text-sm mb-2">
                    {product.price.toLocaleString()}đ
                  </p>
                  <Button
                    size="sm"
                    className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => actions.addToCart(product)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Thêm
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* THANH GIỎ HÀNG DƯỚI ĐÁY MÀN HÌNH (FAB) */}
      {computed.totalCartItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-50 animate-in slide-in-from-bottom-5">
          <Sheet
            open={states.isSheetOpen}
            onOpenChange={setters.setIsSheetOpen}
          >
            <SheetTrigger asChild>
              <Button className="w-full h-14 rounded-2xl shadow-xl bg-green-600 hover:bg-green-700 flex justify-between px-6 text-lg font-bold">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <ShoppingCart className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {computed.totalCartItems}
                    </span>
                  </div>
                  Xem giỏ hàng
                </div>
                <span>{computed.totalCartPrice.toLocaleString()}đ</span>
              </Button>
            </SheetTrigger>

            {/* NỘI DUNG GIỎ HÀNG TRƯỢT LÊN */}
            <SheetContent
              side="bottom"
              className="max-w-md mx-auto h-[80vh] rounded-t-[2rem] flex flex-col"
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left text-xl">
                  Giỏ hàng của bạn
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {states.cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.product.price.toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() =>
                            actions.updateCartQty(item.product.id, -1)
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() =>
                            actions.updateCartQty(item.product.id, 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t mt-4 space-y-4">
                <div className="flex justify-between font-bold text-xl">
                  <span>Tổng tiền tạm tính:</span>
                  <span className="text-primary">
                    {computed.totalCartPrice.toLocaleString()}đ
                  </span>
                </div>
                <Button
                  className="w-full h-14 text-lg rounded-2xl bg-green-600 hover:bg-green-700"
                  onClick={actions.handlePlaceOrder}
                  disabled={states.isOrdering}
                >
                  {states.isOrdering ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Xác nhận gọi món
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
