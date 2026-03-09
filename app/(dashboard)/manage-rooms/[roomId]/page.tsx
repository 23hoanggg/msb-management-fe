/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Minus,
  CreditCard,
  Loader2,
  CheckCheck,
  Coffee,
  AlertTriangle,
  Printer,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print"; // 🟢 Import thư viện in

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}
interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  status: "PENDING" | "SERVED";
  product: Product;
}
interface RoomSession {
  id: string;
  roomId: string;
  startTime: string;
  room: { name: string; roomType: { basePrice: number } };
}
interface Discount {
  percent: number;
  description: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [session, setSession] = useState<RoomSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [durationMinutes, setDurationMinutes] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [isVerifyingDiscount, setIsVerifyingDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // 🟢 Ref để React To Print biết cần "chụp" component nào
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, [roomId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, sessionsRes] = await Promise.all([
        api.get("/products"),
        api.get("/room-sessions/active"),
      ]);
      setProducts(productsRes.data?.data || productsRes.data || []);
      const currentSession = (
        sessionsRes.data?.data ||
        sessionsRes.data ||
        []
      ).find((s: any) => s.roomId === roomId);

      if (currentSession) {
        setSession(currentSession);
        fetchOrderItems(currentSession.id);
      } else {
        toast.error("Phòng này không có phiên hát!");
        router.push("/");
      }
    } catch (error) {
      toast.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (sessionId: string) => {
    try {
      const res = await api.get(`/orders/session/${sessionId}`);
      setOrderItems(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!session) return;
    const calc = () => {
      const diffMins = Math.ceil(
        (new Date().getTime() - new Date(session.startTime).getTime()) / 60000,
      );
      setDurationMinutes(diffMins > 0 ? diffMins : 1);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    const socket: Socket = io(BACKEND_URL);
    socket.on("new-order", (data: { sessionId: string }) => {
      if (data.sessionId === session.id) {
        toast.info("🔔 Khách hàng vừa gọi món mới!", {
          style: { background: "#3b82f6", color: "white" },
        });
        fetchOrderItems(session.id);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [session]);

  // CÁC HÀM THAO TÁC MÓN
  const handleAddOrder = async (productId: string, qty: number = 1) => {
    if (!session) return;
    try {
      await api.post("/orders", {
        sessionId: session.id,
        productId,
        quantity: qty,
      });
      fetchOrderItems(session.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stockQuantity: p.stockQuantity - qty }
            : p,
        ),
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi!");
    }
  };

  const handleReduceOrder = async (productId: string, qty: number = 1) => {
    if (!session) return;
    try {
      await api.post("/orders/reduce", {
        sessionId: session.id,
        productId,
        quantity: qty,
      });
      fetchOrderItems(session.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stockQuantity: p.stockQuantity + qty }
            : p,
        ),
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi!");
    }
  };

  const handleCustomQuantity = (item: OrderItem) => {
    const input = window.prompt(
      `Nhập số lượng mới cho ${item.product.name}:`,
      item.quantity.toString(),
    );
    if (!input) return;
    const newQty = parseInt(input);
    if (isNaN(newQty) || newQty < 0) return toast.error("Không hợp lệ!");
    const diff = newQty - item.quantity;
    if (diff > 0) handleAddOrder(item.product.id, diff);
    else if (diff < 0) handleReduceOrder(item.product.id, Math.abs(diff));
  };

  const handleServeAll = async () => {
    if (!session) return;
    try {
      await api.patch(`/orders/session/${session.id}/serve`);
      toast.success("Đã xác nhận mang đồ cho khách!");
      fetchOrderItems(session.id);
    } catch (error: any) {
      toast.error("Lỗi!");
    }
  };

  const handleVerifyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      setIsVerifyingDiscount(true);
      const res = await api.get(`/discounts/${discountCode}`);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (data?.percent !== undefined) {
        setAppliedDiscount({
          percent: data.percent,
          description: data.description || "Mã giảm giá",
        });
        toast.success("Áp dụng mã thành công!");
      } else throw new Error();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã không hợp lệ!");
      setAppliedDiscount(null);
    } finally {
      setIsVerifyingDiscount(false);
    }
  };

  const handleCheckout = async () => {
    if (!session) return;
    if (pendingItems.length > 0)
      return toast.error("Vẫn còn món CẦN GIAO NGAY chưa được phục vụ!");
    try {
      setIsProcessing(true);
      await api.post(`/room-sessions/check-out/${session.id}`, {
        discountCode: appliedDiscount ? discountCode : undefined,
      });
      toast.success("Thanh toán thành công! Chuẩn bị in hóa đơn.");
      setShowReceipt(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi thanh toán!");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🟢 Cấu hình hook react-to-print
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Sửa lỗi version mới: dùng contentRef thay vì content
    documentTitle: `Hoa_Don_${session?.room?.name || "Karaoke"}`,
    onAfterPrint: () => {
      // Sau khi in xong (hoặc cancel), ẩn modal và về trang chủ
      setShowReceipt(false);
      router.push("/");
    },
  });

  const handleFinish = () => {
    setShowReceipt(false);
    router.push("/");
  };

  // Tính toán trước khi in
  const totalServiceFee = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.priceAtTime,
    0,
  );
  const estimatedRoomFee = session
    ? Math.round((durationMinutes / 60) * session.room.roomType.basePrice)
    : 0;
  const subTotal = totalServiceFee + estimatedRoomFee;
  const discountAmount = appliedDiscount
    ? Math.round((subTotal * appliedDiscount.percent) / 100)
    : 0;
  const finalAmount = Math.max(0, subTotal - discountAmount);

  const pendingItems = orderItems.filter((item) => item.status === "PENDING");
  const servedItems = orderItems.filter((item) => item.status === "SERVED");

  const getAggregatedItems = (items: OrderItem[]) => {
    const grouped: Record<string, OrderItem & { totalAmount: number }> = {};
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
  const aggregatedPendingItems = getAggregatedItems(pendingItems);

  if (loading)
    return (
      <div className="p-8 flex justify-center h-screen items-center">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );

  return (
    <>
      {/* 1. GIAO DIỆN APP CHÍNH */}
      <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
        {/* HEADER TÊN PHÒNG & NÚT LẤY QR */}
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
                Chi tiết phòng {session?.room?.name || roomId}
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Đang hát: {durationMinutes} phút (Từ{" "}
                {session
                  ? new Date(session.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
                )
              </p>
            </div>
          </div>

          {/* NÚT LẤY MÃ QR ĐỘNG Ở GÓC PHẢI */}
          {session && (
            <Button
              onClick={() => setShowQrModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md font-bold"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Mã QR Gọi Món
            </Button>
          )}
        </div>

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
              {pendingItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PHỤC VỤ */}
          <TabsContent
            value="service"
            className="flex-1 data-[state=active]:flex flex-col min-h-0 overflow-hidden m-0"
          >
            <div className="grid grid-cols-12 gap-6 w-full h-full min-h-0">
              <Card className="col-span-12 lg:col-span-5 flex flex-col min-h-0 border-2 border-primary/20 bg-muted/20">
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="flex items-center gap-2 mb-4">
                    <Coffee className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-lg text-foreground">
                      Theo dõi phục vụ
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {pendingItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                          <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider">
                            Lượt gọi đang chờ
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {pendingItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-3 rounded-lg border bg-card border-red-200 shadow-sm relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                              <div className="flex-1 pl-2">
                                <p className="font-bold text-foreground">
                                  {item.product.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.priceAtTime.toLocaleString()}đ
                                </p>
                              </div>
                              <div className="flex items-center gap-1 mx-2 bg-muted rounded-md p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded text-muted-foreground hover:text-red-500"
                                  onClick={() =>
                                    handleReduceOrder(item.product.id, 1)
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span
                                  className="font-bold text-base w-6 text-center cursor-pointer text-foreground"
                                  onClick={() => handleCustomQuantity(item)}
                                >
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded text-muted-foreground hover:text-green-600"
                                  onClick={() =>
                                    handleAddOrder(item.product.id, 1)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleServeAll}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 shadow-md shrink-0"
                        >
                          <CheckCheck className="w-5 h-5 mr-2" /> Xác nhận đã
                          mang đồ
                        </Button>
                      </div>
                    )}
                    {servedItems.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                          <h4 className="text-sm font-bold text-green-700 dark:text-green-500 uppercase tracking-wider">
                            Đã phục vụ xong
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {servedItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 rounded-lg border bg-muted/50 border-border"
                            >
                              <div className="flex-1 pl-1">
                                <p className="font-medium text-foreground">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.priceAtTime.toLocaleString()}đ
                                </p>
                              </div>
                              <div className="flex items-center gap-1 mx-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() =>
                                    handleReduceOrder(item.product.id, 1)
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span
                                  className="font-semibold text-sm w-6 text-center cursor-pointer text-foreground"
                                  onClick={() => handleCustomQuantity(item)}
                                >
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() =>
                                    handleAddOrder(item.product.id, 1)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card border-t p-4 flex justify-between font-bold shrink-0 rounded-b-xl">
                  <span className="text-foreground">
                    Tiền dịch vụ (Tạm tính):
                  </span>
                  <span className="text-primary">
                    {totalServiceFee.toLocaleString()}đ
                  </span>
                </div>
              </Card>

              <Card className="col-span-12 lg:col-span-7 flex flex-col min-h-0 border-none shadow-md">
                <CardHeader className="pb-4 border-b bg-card z-10 rounded-t-xl shrink-0">
                  <CardTitle className="text-xl text-foreground">
                    Thực đơn
                  </CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-4 bg-muted/20 custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer bg-card hover:border-primary shadow-sm hover:shadow-md border border-transparent transition-all"
                        onClick={() => handleAddOrder(product.id, 1)}
                      >
                        <CardContent className="p-4 text-center space-y-3">
                          <div className="h-20 bg-muted/50 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                            {product.name.toLowerCase().includes("bia")
                              ? "🍺"
                              : product.name.toLowerCase().includes("nước")
                                ? "🥤"
                                : "🍉"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-sm text-primary font-bold">
                              {product.price.toLocaleString()}đ
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: THANH TOÁN */}
          <TabsContent
            value="billing"
            className="flex-1 data-[state=active]:flex flex-col min-h-0 overflow-hidden m-0"
          >
            <div className="max-w-2xl w-full mx-auto h-full flex flex-col pb-2 min-h-0">
              {pendingItems.length > 0 && (
                <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center gap-3 font-medium border border-red-200 dark:border-red-800 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                  Vẫn còn món CẦN GIAO NGAY. Khách hàng chưa nhận đủ đồ, không
                  thể chốt hóa đơn!
                </div>
              )}

              <Card className="flex-1 flex flex-col min-h-0 shadow-xl border-primary/20">
                <CardHeader className="bg-muted/50 text-center border-b pb-4 shrink-0">
                  <CardTitle className="text-2xl uppercase text-primary tracking-widest">
                    Hóa đơn thanh toán
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {session?.room?.name} -{" "}
                    {new Date().toLocaleDateString("vi-VN")}
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
                              {item.quantity} x{" "}
                              {item.priceAtTime.toLocaleString()}đ
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
                              {item.quantity} x{" "}
                              {item.priceAtTime.toLocaleString()}đ
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
                          onClick={handleVerifyDiscount}
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
                        <div className="flex justify-between items-center text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg border border-green-200 dark:border-green-800">
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
                    <span className="text-red-600 dark:text-red-500 text-3xl">
                      {finalAmount.toLocaleString()}đ
                    </span>
                  </div>
                  <Button
                    className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 uppercase tracking-wider"
                    onClick={handleCheckout}
                    disabled={isProcessing || pendingItems.length > 0}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL 1: HIỂN THỊ MÃ QR GỌI MÓN ĐỘNG */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-primary uppercase font-bold">
              QR Gọi Món Khách Hàng
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <QRCodeSVG
              value={`${window.location.origin}/customer/order/${session?.id}`}
              size={220}
              level={"H"}
              includeMargin={true}
            />
            <p className="mt-4 font-black text-gray-800 text-2xl">
              Phòng {session?.room?.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Sử dụng Zalo hoặc Camera để quét mã
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: XEM TRƯỚC HÓA ĐƠN TRƯỚC KHI IN */}
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

          <div className="flex flex-col items-center py-6 bg-gray-50 rounded-xl mb-4 border border-gray-100">
            <Printer className="w-12 h-12 text-blue-500 mb-3" />
            <p className="text-gray-800 font-bold text-lg text-center">
              Hóa đơn đã được chốt!
            </p>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Bạn có muốn in phiếu đưa cho khách không?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleFinish}
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Bỏ qua
            </Button>

            <Button
              onClick={() => handlePrint()} // 🟢 Gọi hàm in từ react-to-print
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" /> In Hóa Đơn
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🟢 KHU VỰC CHỨA COMPONENT HÓA ĐƠN (Được ẩn đi, chỉ dành cho in) */}
      <div style={{ display: "none" }}>
        <div
          ref={componentRef}
          className="p-4"
          style={{
            fontFamily: "monospace",
            width: "80mm",
            color: "black",
            background: "white",
          }}
        >
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold uppercase mb-1">KARAOKE POS</h2>
            <p className="text-xs m-0">123 Đường ABC, Quận XYZ</p>
            <p className="text-xs m-0">SĐT: 0123.456.789</p>
          </div>

          <div className="text-center mb-4 border-b border-dashed border-black pb-2">
            <h3 className="text-lg font-bold mb-2">HÓA ĐƠN THANH TOÁN</h3>
            <div className="flex justify-between text-xs mt-1">
              <span>Phòng:</span>
              <span className="font-bold">{session?.room?.name}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Giờ vào:</span>
              <span>
                {session
                  ? new Date(session.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Giờ ra:</span>
              <span>
                {new Date().toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <table className="w-full text-xs mb-4 text-left border-collapse">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="py-1 w-1/2">Tên món</th>
                <th className="py-1 w-1/6 text-center">SL</th>
                <th className="py-1 w-1/3 text-right">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Giờ hát ({durationMinutes}p)</td>
                <td className="py-1 text-center">-</td>
                <td className="py-1 text-right">
                  {estimatedRoomFee.toLocaleString()}
                </td>
              </tr>
              {aggregatedServedItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 pr-1">{item.product.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">
                    {item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-black pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Tổng cộng:</span>
              <span>{subTotal.toLocaleString()}đ</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-xs mb-1">
                <span>Giảm giá ({appliedDiscount.percent}%):</span>
                <span>- {discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold mt-2">
              <span>THỰC THU:</span>
              <span>{finalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="text-center mt-6 text-[10px] italic">
            <p className="m-0">Cảm ơn quý khách và hẹn gặp lại!</p>
            <p className="m-0">Powered by Karaoke POS</p>
          </div>
        </div>
      </div>
    </>
  );
}
