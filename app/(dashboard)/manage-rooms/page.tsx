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
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Loader2, DoorOpen } from "lucide-react";
import { toast } from "sonner";

// --- INTERFACES ---
interface RoomType {
  id: string;
  name: string;
  basePrice: number;
}

interface Room {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "REPAIRING";
  typeId: string;
  roomType?: RoomType;
}

export default function ManageRoomsPage() {
  // --- STATES ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // States Modal Thêm/Sửa
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    typeId: "",
    status: "AVAILABLE",
  });

  // States Modal Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- FETCH DATA ---
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

  // --- TÌM KIẾM ---
  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- HELPER UI TRẠNG THÁI ---
  const getStatusUI = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "Trống",
          color:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
      case "OCCUPIED":
        return {
          label: "Có khách",
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
      case "REPAIRING":
        return {
          label: "Bảo trì",
          color:
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        };
      default:
        return { label: "Không rõ", color: "bg-gray-100 text-gray-700" };
    }
  };

  // --- FORM HANDLERS ---
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

  const handleOpenEditForm = (room: Room) => {
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
        const updatePayload = {
          name: formData.name,
          typeId: formData.typeId,
          status: formData.status,
        };
        await api.patch(`/rooms/${editingId}`, updatePayload);
        toast.success("Cập nhật phòng thành công!");
      } else {
        const createPayload = {
          id: formData.id.toUpperCase().trim(),
          name: formData.name,
          typeId: formData.typeId,
          status: formData.status,
        };
        await api.post("/rooms", createPayload);
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

  // --- DELETE HANDLER ---
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
          "Không thể xóa phòng này (Đang có hóa đơn lịch sử)!",
      );
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
            Danh sách Phòng hát
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý các phòng hát và trạng thái phòng.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateForm}
          className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" /> Thêm phòng mới
        </Button>
      </div>

      <Card className="border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-primary" />
              Tổng số: {filteredRooms.length} phòng
            </CardTitle>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc tên phòng..."
                className="pl-9 bg-background border-input focus-visible:ring-primary uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    Mã Phòng
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Tên Phòng
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Loại Phòng
                  </TableHead>
                  <TableHead className="text-center font-bold text-foreground">
                    Trạng thái
                  </TableHead>
                  {/* Đã xóa cột Menu QR tĩnh ở đây */}
                  <TableHead className="text-right font-bold text-foreground pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Không có dữ liệu phòng.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRooms.map((room) => {
                    const statusUI = getStatusUI(room.status);
                    return (
                      <TableRow
                        key={room.id}
                        className="border-border hover:bg-muted/30 transition-colors"
                      >
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
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusUI.color}`}
                          >
                            {statusUI.label}
                          </span>
                        </TableCell>
                        {/* Đã xóa ô chứa nút Copy QR tĩnh ở đây */}
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                              onClick={() => handleOpenEditForm(room)}
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                              onClick={() => {
                                setDeletingId(room.id);
                                setIsDeleteModalOpen(true);
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

      {/* MODAL THÊM / SỬA PHÒNG */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-primary" />
              {editingId ? "Chỉnh sửa phòng hát" : "Thêm phòng hát mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã Phòng (ID) <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="VD: P101"
                  className="bg-background border-input uppercase font-bold text-primary"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="VD: Phòng 101"
                  className="bg-background border-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                  value={formData.typeId}
                  onChange={(e) =>
                    setFormData({ ...formData, typeId: e.target.value })
                  }
                >
                  <option value="" disabled>
                    -- Chọn loại --
                  </option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} - {rt.basePrice.toLocaleString()}đ/h
                    </option>
                  ))}
                </select>
                {roomTypes.length === 0 && (
                  <p className="text-xs text-orange-500">
                    Vui lòng tạo Loại phòng trước!
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Trạng thái hiện tại
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="AVAILABLE">Trống (Sẵn sàng)</option>
                  <option value="OCCUPIED">Có khách</option>
                  <option value="REPAIRING">Bảo trì / Hỏng</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
              className="border-input text-foreground hover:bg-muted"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={isSubmitting || roomTypes.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? "Lưu thay đổi" : "Tạo phòng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Bạn có chắc chắn muốn xóa phòng này? Thao tác này không thể hoàn
              tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
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
                "Xóa vĩnh viễn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
