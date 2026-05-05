/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useManageRooms = () => {
  // --- STATES ---
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    typeId: "",
    status: "AVAILABLE",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- API CALLS ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, typesRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/room-types").catch(() => ({ data: { data: [] } })),
      ]);

      setRooms(roomsRes.data?.data || roomsRes.data || []);
      const types = typesRes.data?.data || typesRes.data || [];
      setRoomTypes(types);

      if (types.length > 0 && !formData.typeId) {
        setFormData((prev) => ({ ...prev, typeId: types[0].id }));
      }
    } catch (error) {
      toast.error("Không thể tải dữ liệu phòng!");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      id: "",
      name: "",
      typeId: roomTypes.length > 0 ? roomTypes[0].id : "",
      status: "AVAILABLE",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (room: any) => {
    setEditingId(room.id);
    setFormData({
      id: room.id,
      name: room.name,
      typeId: room.typeId,
      status: room.status,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.id.trim() || !formData.name.trim() || !formData.typeId) {
      return toast.error(
        "Vui lòng nhập đủ thông tin (Mã phòng, Tên phòng, Loại phòng)!",
      );
    }
    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/rooms/${editingId}`, {
          name: formData.name,
          typeId: formData.typeId,
          status: formData.status,
        });
        toast.success("Cập nhật phòng thành công!");
      } else {
        await api.post("/rooms", {
          id: formData.id.toUpperCase().trim(),
          name: formData.name,
          typeId: formData.typeId,
          status: formData.status,
        });
        toast.success("Thêm phòng mới thành công!");
      }
      setIsFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu phòng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/rooms/${deletingId}`);
      toast.success("Đã xóa phòng thành công!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa phòng này (Đang có hóa đơn)!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPUTED DATA ---
  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return {
    states: {
      rooms,
      roomTypes,
      loading,
      searchTerm,
      isFormModalOpen,
      isSubmitting,
      editingId,
      formData,
      isDeleteModalOpen,
      deletingId,
      filteredRooms,
    },
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
