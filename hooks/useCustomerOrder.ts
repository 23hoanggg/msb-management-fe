/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export const useCustomerOrder = (sessionId: string) => {
  // 1. SERVER STATES (Dữ liệu từ API)
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);

  // 2. UI STATES (Trạng thái giao diện)
  const [loading, setLoading] = useState(true);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. LOCAL STATES (Giỏ hàng tạm thời)
  const [localCart, setLocalCart] = useState<{ [productId: string]: number }>(
    {},
  );

  const BACKEND_URL = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
  ).replace(/\/$/, "");

  // --- API FETCHING ---
  const fetchMenu = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/products`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${BACKEND_URL}/api/categories`)
          .then((res) => res.json())
          .catch(() => []),
      ]);
      setProducts(
        Array.isArray(prodRes?.data)
          ? prodRes.data
          : Array.isArray(prodRes)
            ? prodRes
            : [],
      );
      setCategories(
        Array.isArray(catRes?.data)
          ? catRes.data
          : Array.isArray(catRes)
            ? catRes
            : [],
      );
    } catch (error) {
      console.error("Lỗi tải menu", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderedItems = async () => {
    try {
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

  // --- INITIALIZE & SOCKET ---
  useEffect(() => {
    if (!sessionId) return;
    fetchMenu();
    fetchOrderedItems();

    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("order-status-changed", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        fetchOrderedItems();
        toast.success("Món ăn của bạn đang được mang vào phòng!", {
          icon: "🛎️",
          style: { background: "#10b981", color: "white" },
        });
      }
    });

    socket.on("room-status-changed", () => fetchOrderedItems());

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // --- CART LOGIC ---
  const handleUpdateCart = (product: any, delta: number) => {
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

  const handleSubmitOrder = async () => {
    const itemsToOrder = Object.entries(localCart);
    if (itemsToOrder.length === 0) return;

    try {
      setIsSubmitting(true);
      await Promise.all(
        itemsToOrder.map(async ([productId, quantity]) => {
          const res = await fetch(`${BACKEND_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, productId, quantity }),
          });
          if (!res.ok)
            throw new Error((await res.json()).message || "Lỗi gọi món");
        }),
      );

      toast.success("Tuyệt vời! Đã gửi order cho Lễ tân 🚀", {
        position: "top-center",
      });
      setLocalCart({});
      setIsCartOpen(false);
      fetchOrderedItems();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, không thể gọi món!");
      if (
        error.message?.includes("kết thúc") ||
        error.message?.includes("hết hạn")
      )
        setIsSessionClosed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPUTED DATA ---
  const filteredProducts =
    activeCategory === "ALL"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);
  const totalCartItems = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalCartPrice = Object.entries(localCart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  return {
    states: {
      loading,
      isSessionClosed,
      products,
      categories,
      orderedItems,
      activeCategory,
      isCartOpen,
      isSubmitting,
      localCart,
    },
    computed: { filteredProducts, totalCartItems, totalCartPrice },
    setters: { setActiveCategory, setIsCartOpen },
    actions: { handleUpdateCart, handleSubmitOrder },
  };
};
