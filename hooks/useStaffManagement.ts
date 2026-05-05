/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useStaffManagement = () => {
  // 1. DATA STATES
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 2. FORM STATES
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "STAFF",
  });

  // 3. DELETE STATES
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- API CALLS ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- ACTIONS ---
  const handleOpenUserForm = (user?: any) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: "",
        role: user.role,
      });
    } else {
      setEditingId(null);
      setFormData({
        username: "",
        email: "",
        fullName: "",
        password: "",
        role: "STAFF",
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmitUser = async () => {
    if (
      !formData.username.trim() ||
      !formData.fullName.trim() ||
      !formData.email.trim()
    ) {
      return toast.error("Nhập đủ Tên đăng nhập, Họ tên và Email!");
    }
    if (!editingId && !formData.password) {
      return toast.error("Đặt mật khẩu cho tài khoản mới!");
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/users/${editingId}`, {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
        });

        // Chỉ reset mật khẩu nếu người quản trị nhập mật khẩu mới
        if (formData.password) {
          await api.post(`/users/reset-password/${editingId}`, {
            newPassword: formData.password,
          });
        }
        toast.success("Cập nhật thành công!");
      } else {
        await api.post("/users/create-staff", formData);
        toast.success("Tạo tài khoản thành công!");
      }
      setIsFormModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu tài khoản!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/users/${deletingId}`);
      toast.success("Đã xóa tài khoản!");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPUTED ---
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
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
      deletingId,
    },
    computed: { filteredUsers },
    setters: {
      setSearchTerm,
      setIsFormModalOpen,
      setFormData,
      setIsDeleteModalOpen,
      setDeletingId,
    },
    actions: { handleOpenUserForm, handleSubmitUser, handleConfirmDelete },
  };
};
