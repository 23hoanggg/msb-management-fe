/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
}

export default function StaffManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- 1. LẤY DỮ LIỆU ---
  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- 2. FORM TÀI KHOẢN ---
  const handleOpenUserForm = (user?: User) => {
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
    )
      return toast.error("Nhập đủ Tên đăng nhập, Họ tên và Email!");
    if (!editingId && !formData.password)
      return toast.error("Đặt mật khẩu cho tài khoản mới!");

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/users/${editingId}`, {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
        });
        if (formData.password)
          await api.post(`/users/reset-password/${editingId}`, {
            newPassword: formData.password,
          });
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Quản lý Nhân sự
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách tài khoản và phân quyền truy cập hệ thống.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Danh sách tài khoản (
              {filteredUsers.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên nhân viên..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => handleOpenUserForm()}>
                <Plus className="w-5 h-5 mr-1" /> Thêm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold pl-6 py-4">Họ và Tên</TableHead>
                <TableHead className="font-bold">Tên đăng nhập</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="text-center font-bold">Chức vụ</TableHead>
                <TableHead className="text-right font-bold pr-6">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không tìm thấy tài khoản nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6 font-bold">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.role === "ADMIN" ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 mx-auto w-max flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3" /> Quản lý
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mx-auto w-max flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3" /> Lễ tân
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenUserForm(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeletingId(user.id);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL TÀI KHOẢN */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Cập nhật tài khoản" : "Tạo tài khoản nhân viên"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và Tên</label>
              <Input
                value={formData.fullName}
                placeholder="VD: Nguyễn Văn A"
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={formData.username}
                  placeholder="VD: staff_01"
                  disabled={!!editingId}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  placeholder={editingId ? "Bỏ trống để giữ" : "******"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="VD: staff@musicbox.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân quyền</label>
              <select
                className="flex h-10 w-full rounded-md border px-3 bg-white text-black dark:bg-slate-800 dark:text-white dark:border-slate-700"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="STAFF">Nhân viên Lễ tân</option>
                <option value="ADMIN">Quản lý (Admin)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 mr-2" />
              )}
              {editingId ? "Cập nhật" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không
              thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
