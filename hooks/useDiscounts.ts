/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useDiscounts = () => {
  // --- 1. STATES ---
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    percent: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- 2. UTILITIES (Helpers) ---
  const formatForInput = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const getDiscountStatus = (discount: any) => {
    if (!discount.isActive)
      return { label: "Đã khóa", color: "bg-gray-100 text-gray-700" };
    const now = new Date();
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);

    if (now < start)
      return { label: "Sắp tới", color: "bg-blue-100 text-blue-700" };
    if (now > end)
      return { label: "Hết hạn", color: "bg-red-100 text-red-700" };
    return { label: "Đang diễn ra", color: "bg-green-100 text-green-700" };
  };

  // --- 3. API CALLS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/discounts");
      setDiscounts(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu khuyến mãi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 4. ACTIONS ---
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      code: "",
      description: "",
      percent: 0,
      startDate: formatForInput(new Date().toISOString()),
      endDate: formatForInput(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (discount: any) => {
    setEditingId(discount.id);
    setFormData({
      code: discount.code,
      description: discount.description || "",
      percent: discount.percent,
      startDate: formatForInput(discount.startDate),
      endDate: formatForInput(discount.endDate),
      isActive: discount.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.code.trim())
      return toast.error("Vui lòng nhập mã khuyến mãi!");
    if (formData.percent <= 0 || formData.percent > 100)
      return toast.error("Phần trăm giảm phải từ 1 đến 100!");
    if (!formData.startDate || !formData.endDate)
      return toast.error("Vui lòng chọn ngày bắt đầu và kết thúc!");

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start)
      return toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu!");

    try {
      setIsSubmitting(true);
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        percent: Number(formData.percent),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isActive: formData.isActive,
      };

      if (editingId) {
        await api.patch(`/discounts/${editingId}`, payload);
        toast.success("Cập nhật mã thành công!");
      } else {
        await api.post("/discounts", payload);
        toast.success("Thêm mã mới thành công!");
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra (Có thể mã đã tồn tại)!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (discount: any) => {
    try {
      await api.patch(`/discounts/${discount.id}`, {
        isActive: !discount.isActive,
      });
      toast.success(discount.isActive ? "Đã khóa mã!" : "Đã mở khóa mã!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/discounts/${deletingId}`);
      toast.success("Đã xóa mã khuyến mãi thành công!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa vì mã này đã được sử dụng!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. COMPUTED ---
  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description &&
        d.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return {
    states: {
      loading,
      searchTerm,
      isFormModalOpen,
      isSubmitting,
      editingId,
      formData,
      isDeleteModalOpen,
    },
    computed: { filteredDiscounts },
    setters: {
      setSearchTerm,
      setIsFormModalOpen,
      setFormData,
      setIsDeleteModalOpen,
      setDeletingId,
    },
    actions: {
      handleOpenCreateForm,
      handleOpenEditForm,
      handleSubmitForm,
      handleToggleActive,
      handleConfirmDelete,
    },
    helpers: { getDiscountStatus },
  };
};
