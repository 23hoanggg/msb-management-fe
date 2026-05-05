/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useHistory = () => {
  // --- 1. STATES ---
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  // --- 2. GỌI API ---
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/room-sessions/history");
      setSessions(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Lỗi tải lịch sử giao dịch!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- 3. ACTIONS ---
  const handleViewReceipt = async (session: any) => {
    setSelectedSession(session);
    setIsReceiptModalOpen(true);
    try {
      setLoadingBill(true);
      const res = await api.get(`/orders/session/${session.id}`);
      setOrderItems(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Lỗi tải chi tiết hóa đơn!");
    } finally {
      setLoadingBill(false);
    }
  };

  // --- 4. TÍNH TOÁN DỮ LIỆU BÁO CÁO (COMPUTED) ---
  const filteredSessions = sessions.filter((s) =>
    s.room.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Tính tiền phòng
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

  // Lọc và gộp món ăn đã giao
  const servedItems = orderItems.filter((item) => item.status === "SERVED");
  const getAggregatedItems = (items: any[]) => {
    const grouped: Record<string, any> = {};
    items.forEach((item) => {
      if (grouped[item.product.id]) {
        grouped[item.product.id].quantity += item.quantity;
      } else {
        grouped[item.product.id] = { ...item };
      }
    });
    return Object.values(grouped);
  };
  const aggregatedServedItems = getAggregatedItems(servedItems);

  // Tính tổng tiền dịch vụ và Bill
  const totalServiceFee = servedItems.reduce(
    (sum, item) => sum + item.quantity * item.priceAtTime,
    0,
  );
  const dbSubTotal =
    selectedSession?.subTotal || estimatedRoomFee + totalServiceFee;
  const dbDiscountAmount = selectedSession?.discountAmount || 0;
  const dbFinalAmount =
    selectedSession?.finalAmount || estimatedRoomFee + totalServiceFee;

  return {
    states: {
      loading,
      searchTerm,
      sessions,
      selectedSession,
      isReceiptModalOpen,
      loadingBill,
    },
    computed: {
      filteredSessions,
      receiptData: {
        durationMinutes,
        estimatedRoomFee,
        aggregatedServedItems,
        totalServiceFee,
        dbSubTotal,
        dbDiscountAmount,
        dbFinalAmount,
      },
    },
    setters: { setSearchTerm, setIsReceiptModalOpen },
    actions: { handleViewReceipt },
  };
};
