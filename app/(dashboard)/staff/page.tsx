/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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

// IMPORT HOOK LOGIC
import { useStaffManagement } from "@/hooks/useStaffManagement";

export default function StaffManagementPage() {
  const { states, computed, setters, actions } = useStaffManagement();

  if (states.loading)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
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

      {/* BẢNG TÀI KHOẢN */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Danh sách tài khoản (
              {computed.filteredUsers.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên nhân viên..."
                  className="pl-9"
                  value={states.searchTerm}
                  onChange={(e) => setters.setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => actions.handleOpenUserForm()}>
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
              {computed.filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không tìm thấy tài khoản nào.
                  </TableCell>
                </TableRow>
              ) : (
                computed.filteredUsers.map((user) => (
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
                        onClick={() => actions.handleOpenUserForm(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setters.setDeletingId(user.id);
                          setters.setIsDeleteModalOpen(true);
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

      {/* MODAL THÊM / SỬA */}
      <Dialog
        open={states.isFormModalOpen}
        onOpenChange={setters.setIsFormModalOpen}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {states.editingId
                ? "Cập nhật tài khoản"
                : "Tạo tài khoản nhân viên"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và Tên</label>
              <Input
                value={states.formData.fullName}
                placeholder="VD: Nguyễn Văn A"
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    fullName: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={states.formData.username}
                  placeholder="VD: staff_01"
                  disabled={!!states.editingId}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      username: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  placeholder={states.editingId ? "Bỏ trống để giữ" : "******"}
                  value={states.formData.password}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      password: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="VD: staff@musicbox.com"
                value={states.formData.email}
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân quyền</label>
              <select
                className="flex h-10 w-full rounded-md border px-3 bg-white text-black dark:bg-slate-800 dark:text-white dark:border-slate-700"
                value={states.formData.role}
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    role: e.target.value,
                  })
                }
              >
                <option value="STAFF">Nhân viên Lễ tân</option>
                <option value="ADMIN">Quản lý (Admin)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={actions.handleSubmitUser}
              disabled={states.isSubmitting}
            >
              {states.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 mr-2" />
              )}
              {states.editingId ? "Cập nhật" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog
        open={states.isDeleteModalOpen}
        onOpenChange={setters.setIsDeleteModalOpen}
      >
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
              onClick={() => setters.setIsDeleteModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={actions.handleConfirmDelete}
              disabled={states.isSubmitting}
            >
              {states.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}{" "}
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
