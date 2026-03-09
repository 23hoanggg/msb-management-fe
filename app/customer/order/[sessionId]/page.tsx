/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  History,
  UtensilsCrossed,
  XCircle,
  Loader2,
  Music,
} from "lucide-react";
import { toast } from "sonner";

// --- INTERFACES ---
interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
}
interface Category {
  id: string;
  name: string;
}
interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  status: "PENDING" | "SERVED";
  product: Product;
}

export default function CustomerOrderPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [orderedItems, setOrderedItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSessionClosed, setIsSessionClosed] = useState(false);

  const [localCart, setLocalCart] = useState<{ [productId: string]: number }>(
    {},
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchOrderedItems();
  }, [sessionId]);

  useEffect(() => {
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const socket: Socket = io(BACKEND_URL);

    socket.on("order-status-changed", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        fetchOrderedItems();

        toast.success("Món ăn của bạn đang được mang vào phòng!", {
          icon: "🛎️",
          style: { background: "#10b981", color: "white" },
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);
  const fetchMenu = async () => {
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const [prodRes, catRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/products`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${BACKEND_URL}/api/categories`)
          .then((res) => res.json())
          .catch(() => []),
      ]);

      const productsData = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes)
          ? prodRes
          : [];
      const categoriesData = Array.isArray(catRes?.data)
        ? catRes.data
        : Array.isArray(catRes)
          ? catRes
          : [];

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Lỗi tải menu", error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderedItems = async () => {
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${BACKEND_URL}/api/orders/session/${sessionId}`);
      if (!res.ok) {
        if (res.status === 400 || res.status === 404) setIsSessionClosed(true);
        return;
      }
      const data = await res.json();
      setOrderedItems(data.data || data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // --- LOGIC GIỎ HÀNG LOCAL ---
  const handleUpdateCart = (product: Product, delta: number) => {
    if (isSessionClosed) return toast.error("Phiên hát đã kết thúc!");

    setLocalCart((prev) => {
      const currentQty = prev[product.id] || 0;
      const newQty = currentQty + delta;

      if (newQty > product.stockQuantity) {
        toast.error(`Xin lỗi, chỉ còn ${product.stockQuantity} món trong kho!`);
        return prev;
      }

      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: newQty };
    });
  };

  const totalCartItems = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalCartPrice = Object.entries(localCart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  // --- GỬI ĐƠN HÀNG LÊN BACKEND ---
  const handleSubmitOrder = async () => {
    const itemsToOrder = Object.entries(localCart);
    if (itemsToOrder.length === 0) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      setIsSubmitting(true);
      await Promise.all(
        itemsToOrder.map(async ([productId, quantity]) => {
          const res = await fetch(`${BACKEND_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, productId, quantity }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Lỗi gọi món");
          }
        }),
      );

      toast.success("Tuyệt vời! Đã gửi order cho Lễ tân 🚀", {
        position: "top-center",
        duration: 3000,
      });
      setLocalCart({});
      setIsCartOpen(false);
      fetchOrderedItems();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, không thể gọi món!");
      if (
        error.message?.includes("kết thúc") ||
        error.message?.includes("hết hạn")
      ) {
        setIsSessionClosed(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts =
    activeCategory === "ALL"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  // MÀN HÌNH KHÓA:PHIÊN HÁT ĐÃ KẾT THÚC
  if (isSessionClosed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
          Phiên hát kết thúc
        </h1>
        <p className="text-slate-500 font-medium">
          Cảm ơn quý khách đã sử dụng dịch vụ. Mã QR này hiện không còn hiệu
          lực.
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          <p className="text-slate-500 font-medium animate-pulse">
            Đang tải thực đơn...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:max-w-md md:mx-auto md:shadow-2xl relative font-sans">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest">
                KARAOKE POS
              </h1>
              <p className="text-[11px] text-purple-100 uppercase tracking-widest">
                Thực đơn điện tử
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md h-10 w-10"
            onClick={() => setIsCartOpen(true)}
          >
            <History className="w-5 h-5 text-white" />
            {orderedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-purple-600">
                {orderedItems.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* DANH MỤC (PILLS) */}
      <div className="sticky top-[88px] z-10 bg-slate-50/90 backdrop-blur-md py-3 px-4 overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-slate-200/50">
        <div className="flex gap-2">
          <button
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              activeCategory === "ALL"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
            onClick={() => setActiveCategory("ALL")}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* SẢN PHẨM LƯỚI */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const qtyInCart = localCart[product.id] || 0;

          const getIcon = (name: string) => {
            const n = name.toLowerCase();
            if (
              n.includes("bia") ||
              n.includes("heineken") ||
              n.includes("tiger")
            )
              return "🍻";
            if (n.includes("nước") || n.includes("coca") || n.includes("sting"))
              return "🥤";
            if (n.includes("trái cây") || n.includes("đĩa")) return "🍉";
            if (n.includes("mực") || n.includes("khô") || n.includes("bò"))
              return "🦑";
            if (n.includes("thuốc") || n.includes("shisha")) return "💨";
            return "🍔";
          };

          return (
            <Card
              key={product.id}
              className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl flex flex-col group"
            >
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {product.imageUrl ? (
                  <img
                    src={
                      product.imageUrl.startsWith("http")
                        ? product.imageUrl
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}${product.imageUrl}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  getIcon(product.name)
                )}
              </div>
              <CardContent className="p-3 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-purple-600 font-black text-sm mt-1">
                    {product.price.toLocaleString()}{" "}
                    <span className="text-[10px] text-purple-400">VNĐ</span>
                  </p>
                </div>

                {qtyInCart > 0 ? (
                  <div className="flex items-center justify-between bg-purple-50 rounded-full p-1 border border-purple-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white text-purple-600 shadow-sm hover:bg-purple-100"
                      onClick={() => handleUpdateCart(product, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-black text-purple-800 text-sm w-6 text-center">
                      {qtyInCart}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-purple-600 text-white shadow-sm hover:bg-purple-700"
                      onClick={() => handleUpdateCart(product, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full h-9 rounded-full text-xs font-bold bg-slate-900 hover:bg-purple-600 text-white transition-colors"
                    onClick={() => handleUpdateCart(product, 1)}
                    disabled={product.stockQuantity <= 0}
                  >
                    {product.stockQuantity <= 0 ? "Hết hàng" : "Chọn món"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GIỎ HÀNG NỔI (BOTTOM BAR) */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-20 md:max-w-md md:mx-auto animate-in slide-in-from-bottom-10 pt-10">
          <Button
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-600/30 flex justify-between px-6 text-lg transition-transform active:scale-95"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-black text-sm">
                {totalCartItems}
              </div>
              <span className="font-bold tracking-wide">Xem giỏ hàng</span>
            </div>
            <span className="font-black">
              {totalCartPrice.toLocaleString()}đ
            </span>
          </Button>
        </div>
      )}

      {/* MODAL GIỎ HÀNG VÀ LỊCH SỬ GỌI MÓN (BOTTOM SHEET) */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="fixed top-auto bottom-0 left-[50%] translate-x-[-50%] translate-y-0 sm:max-w-md w-full h-[85vh] rounded-t-3xl rounded-b-none p-0 flex flex-col border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1"></div>

          <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0 text-left">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              Giỏ hàng của bạn
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar">
            {/* PHẦN 1: MÓN ĐANG CHỌN */}
            {totalCartItems > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Đang chọn (Chưa gửi)
                </h4>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
                  {Object.entries(localCart).map(([id, qty], index, arr) => {
                    const p = products.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div
                        key={id}
                        className={`flex justify-between items-center py-3 px-2 ${
                          index !== arr.length - 1
                            ? "border-b border-dashed border-slate-200"
                            : ""
                        }`}
                      >
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-slate-800 text-sm leading-tight">
                            {p.name}
                          </p>
                          <p className="text-xs text-purple-600 font-bold mt-1">
                            {p.price.toLocaleString()}đ
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1 border border-slate-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                            onClick={() => handleUpdateCart(p, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-black text-slate-800 text-sm w-4 text-center">
                            {qty}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-purple-600 bg-purple-100 hover:bg-purple-200"
                            onClick={() => handleUpdateCart(p, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHẦN 2: LỊCH SỬ ĐÃ GỌI */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <History className="w-4 h-4" /> Lịch sử đã gửi
              </h4>
              {orderedItems.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <UtensilsCrossed className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-slate-400 font-medium text-sm">
                    Chưa có món nào được gọi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Số lượng:{" "}
                          <span className="font-black text-slate-700">
                            {item.quantity}
                          </span>
                        </p>
                      </div>
                      <div>
                        {item.status === "PENDING" ? (
                          <span className="text-orange-600 flex items-center gap-1.5 text-[11px] font-black bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Chờ món
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1.5 text-[11px] font-black bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Đã giao
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {totalCartItems > 0 && (
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-safe">
              <Button
                className="w-full h-14 text-lg font-black tracking-wide bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-900/20"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                XÁC NHẬN GỬI ({totalCartPrice.toLocaleString()}đ)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
