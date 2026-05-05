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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  TicketPercent,
  Lock,
  Unlock,
} from "lucide-react";

// IMPORT HOOK LOGIC
import { useDiscounts } from "@/hooks/useDiscounts";

export default function DiscountManagementPage() {
  const { states, computed, setters, actions, helpers } = useDiscounts();

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
            Quản lý Khuyến mãi
          </h2>
          <p className="text-muted-foreground mt-1">
            Tạo mã giảm giá, thiết lập thời gian và theo dõi trạng thái.
          </p>
        </div>
        <Button
          onClick={actions.handleOpenCreateForm}
          className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" /> Tạo mã giảm giá
        </Button>
      </div>

      {/* KHU VỰC BẢNG DỮ LIỆU */}
      <Card className="border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-primary" /> Danh sách mã
              giảm giá ({computed.filteredDiscounts.length})
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc mô tả..."
                className="pl-9 bg-background border-input focus-visible:ring-primary uppercase"
                value={states.searchTerm}
                onChange={(e) => setters.setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="font-bold text-foreground pl-6">
                    Mã CODE
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Mô tả chi tiết
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-center">
                    Mức giảm
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-center">
                    Thời gian áp dụng
                  </TableHead>
                  <TableHead className="text-center font-bold text-foreground">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right font-bold text-foreground pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Không có mã khuyến mãi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  computed.filteredDiscounts.map((item) => {
                    const status = helpers.getDiscountStatus(item);
                    return (
                      <TableRow
                        key={item.id}
                        className="border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="pl-6 font-bold text-primary text-lg tracking-wider">
                          {item.code}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {item.description || (
                            <span className="text-muted-foreground italic">
                              Không có mô tả
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-red-600 text-lg">
                          {item.percent}%
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground space-y-1">
                          <div>
                            Từ:{" "}
                            <span className="text-foreground font-medium">
                              {new Date(item.startDate).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div>
                            Đến:{" "}
                            <span className="text-foreground font-medium">
                              {new Date(item.endDate).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                item.isActive
                                  ? "text-orange-500 hover:bg-orange-100"
                                  : "text-green-600 hover:bg-green-100"
                              }
                              onClick={() => actions.handleToggleActive(item)}
                              title={
                                item.isActive ? "Khóa mã này" : "Mở khóa mã này"
                              }
                            >
                              {item.isActive ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-100"
                              onClick={() => actions.handleOpenEditForm(item)}
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-100"
                              onClick={() => {
                                setters.setDeletingId(item.id);
                                setters.setIsDeleteModalOpen(true);
                              }}
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL THÊM / SỬA MÃ */}
      <Dialog
        open={states.isFormModalOpen}
        onOpenChange={setters.setIsFormModalOpen}
      >
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-primary" />{" "}
              {states.editingId
                ? "Chỉnh sửa mã giảm giá"
                : "Tạo mã giảm giá mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã CODE <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="VD: VIP2026"
                  className="bg-background border-input uppercase font-bold text-primary"
                  value={states.formData.code}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      code: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Giảm giá (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  className="bg-background border-input font-bold text-red-500"
                  value={states.formData.percent}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      percent: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mô tả chương trình
              </label>
              <Input
                placeholder="VD: Giảm giá ngày khai trương..."
                className="bg-background border-input"
                value={states.formData.description}
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Từ ngày <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  className="bg-background border-input"
                  value={states.formData.startDate}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Đến ngày <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  className="bg-background border-input"
                  value={states.formData.endDate}
                  onChange={(e) =>
                    setters.setFormData({
                      ...states.formData,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md mt-2 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">
                  Trạng thái mã
                </label>
                <p className="text-xs text-muted-foreground">
                  Bật để cho phép Lễ tân sử dụng mã này.
                </p>
              </div>
              <Button
                variant={states.formData.isActive ? "default" : "secondary"}
                className={
                  states.formData.isActive
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                onClick={() =>
                  setters.setFormData({
                    ...states.formData,
                    isActive: !states.formData.isActive,
                  })
                }
              >
                {states.formData.isActive ? "Đang Bật" : "Đang Tắt"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setters.setIsFormModalOpen(false)}
              className="border-input text-foreground hover:bg-muted"
            >
              Hủy
            </Button>
            <Button
              onClick={actions.handleSubmitForm}
              disabled={states.isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {states.isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              {states.editingId ? "Lưu thay đổi" : "Tạo mã"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog
        open={states.isDeleteModalOpen}
        onOpenChange={setters.setIsDeleteModalOpen}
      >
        <DialogContent className="sm:max-w-[400px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
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
                "Xóa vĩnh viễn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
