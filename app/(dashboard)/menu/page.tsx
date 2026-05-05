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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  PackageSearch,
  FolderTree,
  ImageIcon,
} from "lucide-react";
import { useMenuManagement } from "@/hooks/useMenuManagement";

export default function MenuManagementPage() {
  const { states, computed, setters, actions } = useMenuManagement();

  if (states.loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Quản lý Thực đơn & Danh mục
        </h2>
        <p className="text-muted-foreground mt-1">
          Cấu hình các món ăn, đồ uống và phân loại nhóm.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="products" className="text-base font-medium">
            <PackageSearch className="w-4 h-4 mr-2" /> Món ăn / Dịch vụ
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-base font-medium">
            <FolderTree className="w-4 h-4 mr-2" /> Danh mục phân loại
          </TabsTrigger>
        </TabsList>

        {/* TAB SẢN PHẨM */}
        <TabsContent value="products" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl">
                  Sản phẩm ({computed.filteredProducts.length})
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm món ăn..."
                      className="pl-9"
                      value={states.searchTerm}
                      onChange={(e) => setters.setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => actions.handleOpenProductForm()}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm món
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-20 text-center font-bold">
                      Hình ảnh
                    </TableHead>
                    <TableHead className="font-bold">Tên món</TableHead>
                    <TableHead className="font-bold">Danh mục</TableHead>
                    <TableHead className="text-right font-bold">
                      Giá bán
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      Tồn kho
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-center p-2">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            className="w-12 h-12 object-cover rounded-md border"
                            alt="img"
                          />
                        ) : (
                          <div className="w-12 h-12 mx-auto bg-muted rounded-md flex items-center justify-center text-xl border">
                            🍲
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.category?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {p.price.toLocaleString()}đ
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          {p.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600"
                          onClick={() => actions.handleOpenProductForm(p)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() =>
                            setters.setDeleteData({ id: p.id, type: "product" })
                          }
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

        {/* TAB DANH MỤC */}
        <TabsContent value="categories" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl">
                  Nhóm Danh mục ({computed.filteredCategories.length})
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm danh mục..."
                      className="pl-9"
                      value={states.searchTerm}
                      onChange={(e) => setters.setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => actions.handleOpenCategoryForm()}
                    variant="secondary"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Tạo nhóm
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold pl-6">
                      Tên Danh mục
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      Số món ăn
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.filteredCategories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 font-medium text-lg text-primary">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-muted-foreground">
                        {c._count?.products || 0} món
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600"
                          onClick={() => actions.handleOpenCategoryForm(c)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() =>
                            setters.setDeleteData({
                              id: c.id,
                              type: "category",
                            })
                          }
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
      </Tabs>

      {/* MODAL SẢN PHẨM */}
      <Dialog
        open={states.isProductModalOpen}
        onOpenChange={setters.setIsProductModalOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {states.editingProductId ? "Sửa món ăn" : "Thêm món mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
              {states.previewImage ? (
                <img
                  src={states.previewImage}
                  className="w-16 h-16 object-cover rounded-md border"
                  alt="preview"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center border border-dashed">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">
                  Hình ảnh (Tùy chọn)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={actions.handleImageChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên món</label>
              <Input
                value={states.productData.name}
                onChange={(e) =>
                  setters.setProductData({
                    ...states.productData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục</label>
              <select
                className="flex h-10 w-full rounded-md border px-3 bg-white text-black dark:bg-slate-800 dark:text-white"
                value={states.productData.categoryId}
                onChange={(e) =>
                  setters.setProductData({
                    ...states.productData,
                    categoryId: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  -- Chọn --
                </option>
                {states.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giá</label>
                <Input
                  type="number"
                  value={states.productData.price}
                  onChange={(e) =>
                    setters.setProductData({
                      ...states.productData,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tồn kho</label>
                <Input
                  type="number"
                  value={states.productData.stockQuantity}
                  onChange={(e) =>
                    setters.setProductData({
                      ...states.productData,
                      stockQuantity: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={actions.handleSubmitProduct}
              disabled={states.isSubmitting}
            >
              {states.isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DANH MỤC */}
      <Dialog
        open={states.isCategoryModalOpen}
        onOpenChange={setters.setIsCategoryModalOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {states.editingCategoryId ? "Sửa Danh mục" : "Tạo Danh mục"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tên danh mục..."
              value={states.categoryName}
              onChange={(e) => setters.setCategoryName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && actions.handleSubmitCategory()
              }
            />
          </div>
          <DialogFooter>
            <Button
              onClick={actions.handleSubmitCategory}
              disabled={states.isSubmitting}
            >
              {states.isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog
        open={!!states.deleteData}
        onOpenChange={(open) => !open && setters.setDeleteData(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Dữ liệu đã xóa không thể phục hồi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setters.setDeleteData(null)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={actions.handleConfirmDelete}
              disabled={states.isSubmitting}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
