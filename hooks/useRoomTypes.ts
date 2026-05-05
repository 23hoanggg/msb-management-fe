/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useRoomTypes = () => {
  // --- 1. STATES ---
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    basePrice: 0,
    description: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- 2. LẤY DỮ LIỆU ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/room-types");
      setRoomTypes(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu loại phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 3. XỬ LÝ FORM THÊM / SỬA ---
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({ name: "", basePrice: 0, description: "" });
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (roomType: any) => {
    setEditingId(roomType.id);
    setFormData({
      name: roomType.name,
      basePrice: roomType.basePrice,
      description: roomType.description || "",
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.name.trim())
      return toast.error("Vui lòng nhập tên loại phòng!");
    if (formData.basePrice < 0) return toast.error("Giá phòng không được âm!");

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        basePrice: Number(formData.basePrice),
        description: formData.description,
      };

      if (editingId) {
        await api.patch(`/room-types/${editingId}`, payload);
        toast.success("Cập nhật loại phòng thành công!");
      } else {
        await api.post("/room-types", payload);
        toast.success("Thêm loại phòng mới thành công!");
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. XỬ LÝ XÓA ---
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/room-types/${deletingId}`);
      toast.success("Đã xóa loại phòng thành công!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa vì đang có phòng thuộc loại này!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. TÍNH TOÁN DỮ LIỆU ---
  const filteredRoomTypes = roomTypes.filter((rt) =>
    rt.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    computed: { filteredRoomTypes },
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
      handleConfirmDelete,
    },
  };
};
