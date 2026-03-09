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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ShieldAlert,
  UserCheck,
  Banknote,
  CheckCircle2,
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

interface Salary {
  id: string;
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deduction: number;
  totalSalary: number;
  isPaid: boolean;
  paidAt?: string;
  note?: string;
  user?: { fullName: string; username: string; role: string };
}

export default function StaffManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // States Lương
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    userId: "",
    baseSalary: 0,
    bonus: 0,
    deduction: 0,
    note: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- 1. LẤY DỮ LIỆU ---
  useEffect(() => {
    fetchUsers();
    fetchSalaries();
  }, [selectedMonth, selectedYear]);

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

  const fetchSalaries = async () => {
    try {
      const res = await api.get(
        `/salaries?month=${selectedMonth}&year=${selectedYear}`,
      );
      setSalaries(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách lương!");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredSalaries = salaries.filter((s) =>
    s.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- FORM TÀI KHOẢN ---
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

  // --- FORM LƯƠNG ---
  const handleOpenSalaryForm = (salary?: Salary) => {
    if (salary) {
      setSalaryForm({
        userId: salary.userId,
        baseSalary: salary.baseSalary,
        bonus: salary.bonus,
        deduction: salary.deduction,
        note: salary.note || "",
      });
    } else {
      setSalaryForm({
        userId: users.length > 0 ? users[0].id : "",
        baseSalary: 5000000,
        bonus: 0,
        deduction: 0,
        note: "",
      });
    }
    setIsSalaryModalOpen(true);
  };

  const handleSubmitSalary = async () => {
    if (!salaryForm.userId || salaryForm.baseSalary < 0)
      return toast.error(
        "Vui lòng chọn nhân viên và nhập lương cơ bản hợp lệ!",
      );

    try {
      setIsSubmitting(true);
      await api.post("/salaries/upsert", {
        ...salaryForm,
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(`Đã lưu lương tháng ${selectedMonth}/${selectedYear}!`);
      setIsSalaryModalOpen(false);
      fetchSalaries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu bảng lương!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaySalary = async (id: string) => {
    if (!confirm("Xác nhận đã thanh toán lương cho nhân viên này?")) return;
    try {
      await api.patch(`/salaries/${id}/pay`);
      toast.success("Thanh toán thành công!");
      fetchSalaries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi thanh toán!");
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
            Nhân sự & Bảng lương
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản và chi trả lương nhân viên.
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="accounts" className="text-base font-medium">
            <Users className="w-4 h-4 mr-2" /> Tài khoản
          </TabsTrigger>
          <TabsTrigger value="salaries" className="text-base font-medium">
            <Banknote className="w-4 h-4 mr-2" /> Bảng lương
          </TabsTrigger>
        </TabsList>

        {/* ======================= TAB 1: TÀI KHOẢN ======================= */}
        <TabsContent value="accounts" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex justify-between items-center gap-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Tài khoản (
                  {filteredUsers.length})
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm tên..."
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
                    <TableHead className="font-bold pl-6">Họ và Tên</TableHead>
                    <TableHead className="font-bold">Tên đăng nhập</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="text-center font-bold">
                      Chức vụ
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
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
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 mx-auto w-max">
                            <ShieldAlert className="w-3 h-3 inline mr-1" /> Quản
                            lý
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mx-auto w-max">
                            <UserCheck className="w-3 h-3 inline mr-1" /> Lễ tân
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600"
                          onClick={() => handleOpenUserForm(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => {
                            setDeletingId(user.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================= TAB 2: BẢNG LƯƠNG ======================= */}
        <TabsContent value="salaries" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-600" /> Bảng lương
                  tháng {selectedMonth}/{selectedYear}
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    className="h-10 rounded-md border px-3"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-md border px-3"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleOpenSalaryForm()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Chấm lương
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold pl-6">Nhân viên</TableHead>
                    <TableHead className="text-right font-bold">
                      Lương cơ bản
                    </TableHead>
                    <TableHead className="text-right font-bold text-green-600">
                      + Thưởng
                    </TableHead>
                    <TableHead className="text-right font-bold text-red-600">
                      - Khấu trừ
                    </TableHead>
                    <TableHead className="text-right font-bold text-primary text-lg">
                      Thực lĩnh
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      Trạng thái
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalaries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Chưa có dữ liệu lương tháng này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalaries.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-6 font-medium">
                          {s.user?.fullName}{" "}
                          <span className="text-xs text-muted-foreground block">
                            {s.user?.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.baseSalary.toLocaleString()}đ
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {s.bonus > 0 ? `+${s.bonus.toLocaleString()}đ` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {s.deduction > 0
                            ? `-${s.deduction.toLocaleString()}đ`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-black text-primary text-lg">
                          {s.totalSalary.toLocaleString()}đ
                        </TableCell>
                        <TableCell className="text-center">
                          {s.isPaid ? (
                            <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Đã trả
                            </span>
                          ) : (
                            <span className="text-orange-600 font-bold text-xs bg-orange-100 px-2 py-1 rounded">
                              Chưa trả
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          {!s.isPaid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 mr-2"
                              onClick={() => handlePaySalary(s.id)}
                            >
                              Thanh toán
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600"
                            onClick={() => handleOpenSalaryForm(s)}
                            disabled={s.isPaid}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân quyền</label>
              <select
                className="flex h-10 w-full rounded-md border px-3"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="STAFF">Lễ tân</option>
                <option value="ADMIN">Quản lý</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitUser} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL LƯƠNG */}
      <Dialog open={isSalaryModalOpen} onOpenChange={setIsSalaryModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              Chấm lương tháng {selectedMonth}/{selectedYear}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nhân viên</label>
              <select
                className="flex h-10 w-full rounded-md border px-3"
                value={salaryForm.userId}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, userId: e.target.value })
                }
              >
                <option value="" disabled>
                  -- Chọn nhân viên --
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lương cơ bản (VNĐ)</label>
              <Input
                type="number"
                min="0"
                value={salaryForm.baseSalary}
                onChange={(e) =>
                  setSalaryForm({
                    ...salaryForm,
                    baseSalary: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-600">
                  Thưởng / Phụ cấp
                </label>
                <Input
                  type="number"
                  min="0"
                  value={salaryForm.bonus}
                  onChange={(e) =>
                    setSalaryForm({
                      ...salaryForm,
                      bonus: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600">
                  Khấu trừ / Tạm ứng
                </label>
                <Input
                  type="number"
                  min="0"
                  value={salaryForm.deduction}
                  onChange={(e) =>
                    setSalaryForm({
                      ...salaryForm,
                      deduction: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú (Tùy chọn)</label>
              <Input
                placeholder="VD: Phạt đi trễ ngày 15/03"
                value={salaryForm.note}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, note: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitSalary} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu bảng lương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
          </DialogHeader>
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
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
