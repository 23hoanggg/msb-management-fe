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
import { Plus, Search, Pencil, Trash2, Loader2, Crown } from "lucide-react";

// IMPORT HOOK LOGIC
import { useRoomTypes } from "@/hooks/useRoomTypes";

export default function RoomTypeManagementPage() {
  const { states, computed, setters, actions } = useRoomTypes();

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
            Cấu hình Loại Phòng
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý các loại phòng hát và mức giá theo giờ.
          </p>
        </div>
        <Button
          onClick={actions.handleOpenCreateForm}
          className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" /> Thêm loại phòng
        </Button>
      </div>

      {/* KHU VỰC BẢNG DỮ LIỆU */}
      <Card className="border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" /> Danh sách loại phòng (
              {computed.filteredRoomTypes.length})
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên loại phòng..."
                className="pl-9 bg-background border-input focus-visible:ring-primary"
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
                    Tên loại phòng
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Mô tả
                  </TableHead>
                  <TableHead className="text-right font-bold text-foreground">
                    Giá mỗi giờ (VNĐ)
                  </TableHead>
                  <TableHead className="text-right font-bold text-foreground pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.filteredRoomTypes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Không có loại phòng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  computed.filteredRoomTypes.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="pl-6 font-bold text-foreground text-lg">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || (
                          <span className="italic opacity-70">
                            Không có mô tả
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">
                        {item.basePrice.toLocaleString()}đ / h
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            onClick={() => actions.handleOpenEditForm(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => {
                              setters.setDeletingId(item.id);
                              setters.setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Dialog
        open={states.isFormModalOpen}
        onOpenChange={setters.setIsFormModalOpen}
      >
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />{" "}
              {states.editingId
                ? "Chỉnh sửa loại phòng"
                : "Thêm loại phòng mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tên loại (VD: VIP, Thường){" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nhập tên loại phòng..."
                className="bg-background border-input font-bold"
                value={states.formData.name}
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Giá gốc mỗi giờ hát (VNĐ){" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1000"
                className="bg-background border-input font-bold text-primary text-lg"
                value={states.formData.basePrice}
                onChange={(e) =>
                  setters.setFormData({
                    ...states.formData,
                    basePrice: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mô tả thêm
              </label>
              <Input
                placeholder="VD: Phòng chứa tối đa 10 người..."
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
              {states.editingId ? "Lưu thay đổi" : "Tạo loại phòng"}
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
              Bạn có chắc chắn muốn xóa loại phòng này? Thao tác này sẽ thất bại
              nếu đang có phòng thực tế sử dụng loại phòng này.
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
