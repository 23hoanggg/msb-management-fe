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
import { Plus, Search, Pencil, Trash2, Loader2, DoorOpen } from "lucide-react";

// IMPORT HOOK VÀ COMPONENT ĐÃ TÁCH
import { useManageRooms } from "@/hooks/useManageRooms";
import RoomFormModal from "@/components/features/manage-rooms/RoomFormModal";

export default function ManageRoomsPage() {
  // GỌI HOOK: Lấy toàn bộ data và function ra dùng
  const { states, setters, actions } = useManageRooms();

  // Helper UI
  const getStatusUI = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { label: "Trống", color: "bg-green-100 text-green-700" };
      case "OCCUPIED":
        return { label: "Có khách", color: "bg-red-100 text-red-700" };
      case "REPAIRING":
        return { label: "Bảo trì", color: "bg-orange-100 text-orange-700" };
      default:
        return { label: "Không rõ", color: "bg-gray-100 text-gray-700" };
    }
  };

  if (states.loading)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER TÌM KIẾM & THÊM MỚI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Danh sách Phòng hát
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý các phòng hát và trạng thái phòng.
          </p>
        </div>
        <Button
          onClick={actions.handleOpenCreateForm}
          className="bg-primary text-primary-foreground shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" /> Thêm phòng mới
        </Button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-primary" /> Tổng số:{" "}
              {states.filteredRooms.length} phòng
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc tên phòng..."
                className="pl-9 uppercase"
                value={states.searchTerm}
                onChange={(e) => setters.setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold pl-6">Mã Phòng</TableHead>
                <TableHead className="font-bold">Tên Phòng</TableHead>
                <TableHead className="font-bold">Loại Phòng</TableHead>
                <TableHead className="text-center font-bold">
                  Trạng thái
                </TableHead>
                <TableHead className="text-right font-bold pr-6">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {states.filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không có dữ liệu phòng.
                  </TableCell>
                </TableRow>
              ) : (
                states.filteredRooms.map((room) => {
                  const statusUI = getStatusUI(room.status);
                  return (
                    <TableRow key={room.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-bold text-primary text-lg">
                        {room.id}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {room.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {room.roomType?.name || "Chưa gắn loại"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusUI.color}`}
                        >
                          {statusUI.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600"
                            onClick={() => actions.handleOpenEditForm(room)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => {
                              setters.setDeletingId(room.id);
                              setters.setIsDeleteModalOpen(true);
                            }}
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
        </CardContent>
      </Card>

      {/* NHÚNG COMPONENT FORM MODAL ĐÃ TÁCH */}
      <RoomFormModal
        isOpen={states.isFormModalOpen}
        onClose={setters.setIsFormModalOpen}
        editingId={states.editingId}
        formData={states.formData}
        setFormData={setters.setFormData}
        roomTypes={states.roomTypes}
        isSubmitting={states.isSubmitting}
        onSubmit={actions.handleSubmitForm}
      />

      {/* MODAL XÓA */}
      <Dialog
        open={states.isDeleteModalOpen}
        onOpenChange={setters.setIsDeleteModalOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phòng này? Thao tác này không thể hoàn
              tác.
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
                <Loader2 className="w-4 h-4 animate-spin" />
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
