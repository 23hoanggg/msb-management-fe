/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
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

export const useCustomerMenu = (roomId: string) => {
  // --- 1. STATES ---
  const [products, setProducts] = useState<Product[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- 2. KHỞI TẠO DỮ LIỆU ---
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

        setSessionId(currentSession ? currentSession.id : null);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchData();
  }, [roomId]);

  // --- 3. LOGIC GIỎ HÀNG ---
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

  // --- 4. GỬI ORDER CHO LỄ TÂN ---
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

  // --- 5. COMPUTED VALUES ---
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  return {
    states: { products, sessionId, loading, cart, isOrdering, isSheetOpen },
    computed: { totalCartItems, totalCartPrice },
    setters: { setIsSheetOpen },
    actions: { addToCart, updateCartQty, handlePlaceOrder },
  };
};
