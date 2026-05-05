/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DoorOpen, Loader2 } from "lucide-react";

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: (val: boolean) => void;
  editingId: string | null;
  formData: any;
  setFormData: (val: any) => void;
  roomTypes: any[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function RoomFormModal({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  roomTypes,
  isSubmitting,
  onSubmit,
}: RoomFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-slate-800 dark:border-slate-700"
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-slate-800 dark:border-slate-700"
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
            onClick={() => onClose(false)}
            className="border-input text-foreground"
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || roomTypes.length === 0}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingId ? "Lưu thay đổi" : "Tạo phòng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
