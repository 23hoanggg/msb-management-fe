/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import api from "@/lib/api";

export const useRoomDetail = (roomId: string) => {
  const router = useRouter();

  // 1. QUẢN LÝ TRẠNG THÁI (STATES)
  const [session, setSession] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [durationMinutes, setDurationMinutes] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any | null>(null);
  const [isVerifyingDiscount, setIsVerifyingDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 2. GỌI API & SOCKET (EFFECTS)
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
      console.error("Lỗi lấy danh sách món:", error);
    }
  };

  // Tính giờ hát tự động mỗi phút
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

  // Lắng nghe Socket.IO cục bộ cho phòng này
  useEffect(() => {
    if (!session?.id) return;
    const rawUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const BACKEND_URL = rawUrl.replace(/\/$/, "");

    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    // Cập nhật giao diện khi có order mới thuộc về phòng này
    socket.on("new-order", (data: { sessionId: string; source?: string }) => {
      if (data.sessionId === session.id) {
        // Chỉ hiện toast cảnh báo cục bộ nếu khách hàng gọi
        if (data.source === "CUSTOMER") {
          toast.info("🔔 Khách hàng vừa gọi món mới qua QR!", {
            style: { background: "#3b82f6", color: "white" },
          });
        }
        fetchOrderItems(session.id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.id]);

  // 3. CÁC HÀM XỬ LÝ (ACTIONS)

  const handleAddOrder = async (productOrId: any, qty: number = 1) => {
    if (!session || !productOrId) return;

    const finalProductId =
      typeof productOrId === "string" ? productOrId : productOrId.id;

    try {
      await api.post("/orders", {
        sessionId: session.id,
        productId: finalProductId,
        quantity: qty,
        source: "STAFF",
      });

      fetchOrderItems(session.id);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === finalProductId
            ? { ...p, stockQuantity: p.stockQuantity - qty }
            : p,
        ),
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi thêm món!");
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
      toast.error(error.response?.data?.message || "Lỗi giảm món!");
    }
  };

  const handleCustomQuantity = (item: any) => {
    const input = window.prompt(
      `Nhập số lượng mới cho ${item.product.name}:`,
      item.quantity.toString(),
    );
    if (!input) return;

    const newQty = parseInt(input);
    if (isNaN(newQty) || newQty < 0)
      return toast.error("Số lượng không hợp lệ!");

    const diff = newQty - item.quantity;
    if (diff > 0) {
      handleAddOrder(item.product, diff);
    } else if (diff < 0) {
      handleReduceOrder(item.product.id, Math.abs(diff));
    }
  };

  const handleServeAll = async () => {
    if (!session) return;
    try {
      await api.patch(`/orders/session/${session.id}/serve`);
      toast.success("Đã xác nhận mang đồ cho khách!");
      fetchOrderItems(session.id);
    } catch (error: any) {
      toast.error("Lỗi xác nhận mang đồ!");
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

  // 4. TÍNH TOÁN DỮ LIỆU ĐỂ HIỂN THỊ (COMPUTED)
  const pendingItems = orderItems.filter((item) => item.status === "PENDING");
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
  const aggregatedPendingItems = getAggregatedItems(pendingItems);

  const totalServiceFee = servedItems.reduce(
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

  // 5. TRẢ VỀ DỮ LIỆU CHO VIEW (RETURN)
  return {
    states: {
      session,
      products,
      loading,
      discountCode,
      appliedDiscount,
      isVerifyingDiscount,
      isProcessing,
    },
    computed: {
      durationMinutes,
      pendingItems,
      servedItems,
      aggregatedServedItems,
      aggregatedPendingItems,
      totalServiceFee,
      estimatedRoomFee,
      subTotal,
      discountAmount,
      finalAmount,
    },
    setters: {
      setSession,
      setDiscountCode,
      setAppliedDiscount,
      setIsProcessing,
    },
    actions: {
      handleAddOrder,
      handleReduceOrder,
      handleCustomQuantity,
      handleServeAll,
      handleVerifyDiscount,
    },
  };
};
