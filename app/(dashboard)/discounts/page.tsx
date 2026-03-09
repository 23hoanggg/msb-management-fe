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
import { toast } from "sonner";

interface Discount {
  id: string;
  code: string;
  description: string;
  percent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    percent: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/discounts");
      setDiscounts(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu khuyến mãi!");
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description &&
        d.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const formatForInput = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // --- HÀM TÍNH TRẠNG THÁI HIỂN THỊ ---
  const getDiscountStatus = (discount: Discount) => {
    if (!discount.isActive)
      return {
        label: "Đã khóa",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      };

    const now = new Date();
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);

    if (now < start)
      return {
        label: "Sắp tới",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      };
    if (now > end)
      return {
        label: "Hết hạn",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };

    return {
      label: "Đang diễn ra",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
  };

  // --- XỬ LÝ FORM THÊM / SỬA ---
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      code: "",
      description: "",
      percent: 0,
      startDate: formatForInput(new Date().toISOString()),
      endDate: formatForInput(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (discount: Discount) => {
    setEditingId(discount.id);
    setFormData({
      code: discount.code,
      description: discount.description || "",
      percent: discount.percent,
      startDate: formatForInput(discount.startDate),
      endDate: formatForInput(discount.endDate),
      isActive: discount.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.code.trim())
      return toast.error("Vui lòng nhập mã khuyến mãi!");
    if (formData.percent <= 0 || formData.percent > 100)
      return toast.error("Phần trăm giảm phải từ 1 đến 100!");
    if (!formData.startDate || !formData.endDate)
      return toast.error("Vui lòng chọn ngày bắt đầu và kết thúc!");

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start)
      return toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu!");

    try {
      setIsSubmitting(true);
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        percent: Number(formData.percent),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isActive: formData.isActive,
      };

      if (editingId) {
        await api.patch(`/discounts/${editingId}`, payload);
        toast.success("Cập nhật mã thành công!");
      } else {
        await api.post("/discounts", payload);
        toast.success("Thêm mã mới thành công!");
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra (Có thể mã đã tồn tại)!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- KHÓA / MỞ KHÓA NHANH ---
  const handleToggleActive = async (discount: Discount) => {
    try {
      await api.patch(`/discounts/${discount.id}`, {
        isActive: !discount.isActive,
      });
      toast.success(discount.isActive ? "Đã khóa mã!" : "Đã mở khóa mã!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/discounts/${deletingId}`);
      toast.success("Đã xóa mã khuyến mãi thành công!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa vì mã này đã được sử dụng trong hóa đơn!",
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
            Quản lý Khuyến mãi
          </h2>
          <p className="text-muted-foreground mt-1">
            Tạo mã giảm giá, thiết lập thời gian và theo dõi trạng thái.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateForm}
          className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" /> Tạo mã giảm giá
        </Button>
      </div>

      <Card className="border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-primary" />
              Danh sách mã giảm giá ({filteredDiscounts.length})
            </CardTitle>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc mô tả..."
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
                {filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Không có mã khuyến mãi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDiscounts.map((item) => {
                    const status = getDiscountStatus(item);
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
                        <TableCell className="text-center font-bold text-red-600 dark:text-red-400 text-lg">
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
                            {/* Nút Khóa / Mở khóa nhanh */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                item.isActive
                                  ? "text-orange-500 hover:text-orange-600 hover:bg-orange-100"
                                  : "text-green-600 hover:text-green-700 hover:bg-green-100"
                              }
                              onClick={() => handleToggleActive(item)}
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
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                              onClick={() => handleOpenEditForm(item)}
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                              onClick={() => {
                                setDeletingId(item.id);
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

      {/* MODAL THÊM / SỬA MÃ */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-primary" />
              {editingId ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
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
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
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
                  value={formData.percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
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
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
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
                variant={formData.isActive ? "default" : "secondary"}
                className={
                  formData.isActive ? "bg-green-600 hover:bg-green-700" : ""
                }
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
              >
                {formData.isActive ? "Đang Bật" : "Đang Tắt"}
              </Button>
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
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? "Lưu thay đổi" : "Tạo mã"}
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
              Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá này không?
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
