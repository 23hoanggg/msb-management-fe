/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
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
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}
interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 1. KIỂM TRA PHÒNG CÓ ĐANG HÁT KHÔNG VÀ LẤY MENU
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy danh sách món
        const pRes = await api.get("/products");
        setProducts(pRes.data?.data || pRes.data || []);

        // Tìm xem phòng này có đang mở không
        const sRes = await api.get("/room-sessions/active");
        const activeSessions = sRes.data?.data || sRes.data || [];
        const currentSession = activeSessions.find(
          (s: any) => s.roomId === roomId,
        );

        if (currentSession) {
          setSessionId(currentSession.id);
        } else {
          setSessionId(null);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roomId]);

  // 2. LOGIC GIỎ HÀNG
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Đã thêm ${product.name} vào giỏ!`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  // 3. GỬI ORDER CHO LỄ TÂN
  const handlePlaceOrder = async () => {
    if (!sessionId) return toast.error("Phòng chưa mở!");
    if (cart.length === 0) return toast.error("Giỏ hàng trống!");

    try {
      setIsOrdering(true);
      await Promise.all(
        cart.map((item) =>
          api.post("/orders", {
            sessionId: sessionId,
            productId: item.product.id,
            quantity: item.quantity,
          }),
        ),
      );

      toast.success(
        "Đặt món thành công! Lễ tân đang chuẩn bị đồ cho bạn nhé.",
        { duration: 5000 },
      );
      setCart([]);
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng gọi Lễ tân!");
    } finally {
      setIsOrdering(false);
    }
  };

  // MÀN HÌNH CHỜ / LỖI CHƯA MỞ PHÒNG
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  if (!sessionId)
    return (
      <div className="flex flex-col justify-center items-center h-screen p-6 text-center space-y-4 bg-muted/30">
        <Music className="w-20 h-20 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Phòng đang trống</h1>
        <p className="text-muted-foreground">
          Vui lòng liên hệ Lễ tân để mở phòng trước khi quét mã gọi món nhé!
        </p>
      </div>
    );

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
          {products.map((product) => (
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
                    onClick={() => addToCart(product)}
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
      {totalCartItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-50 animate-in slide-in-from-bottom-5">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="w-full h-14 rounded-2xl shadow-xl bg-green-600 hover:bg-green-700 flex justify-between px-6 text-lg font-bold">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <ShoppingCart className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalCartItems}
                    </span>
                  </div>
                  Xem giỏ hàng
                </div>
                <span>{totalCartPrice.toLocaleString()}đ</span>
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
                  {cart.map((item) => (
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
                          onClick={() => updateCartQty(item.product.id, -1)}
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
                          onClick={() => updateCartQty(item.product.id, 1)}
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
                    {totalCartPrice.toLocaleString()}đ
                  </span>
                </div>
                <Button
                  className="w-full h-14 text-lg rounded-2xl bg-green-600 hover:bg-green-700"
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                >
                  {isOrdering ? (
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
