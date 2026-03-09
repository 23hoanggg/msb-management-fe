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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  PackageSearch,
  FolderTree,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}
interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
  category?: Category;
}

export default function MenuManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // States Món Ăn
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productData, setProductData] = useState({
    name: "",
    price: 0,
    stockQuantity: 0,
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // States Danh Mục
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState("");

  // States Xóa chung
  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: "product" | "category";
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories").catch(() => ({ data: { data: [] } })),
      ]);
      setProducts(productsRes.data?.data || productsRes.data || []);
      const cats = categoriesRes.data?.data || categoriesRes.data || [];
      setCategories(cats);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // LOGIC MÓN ĂN
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleOpenProductForm = (product?: Product) => {
    if (product) {
      setEditingProductId(product.id);
      setProductData({
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId,
      });
      setPreviewImage(product.imageUrl || null);
    } else {
      setEditingProductId(null);
      setProductData({
        name: "",
        price: 0,
        stockQuantity: 0,
        categoryId: categories.length > 0 ? categories[0].id : "",
      });
      setPreviewImage(null);
    }
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async () => {
    if (!productData.name || !productData.categoryId)
      return toast.error("Nhập tên món và chọn danh mục!");
    if (productData.price < 0 || productData.stockQuantity < 0)
      return toast.error("Giá/số lượng không hợp lệ!");

    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      submitData.append("name", productData.name);
      submitData.append("price", productData.price.toString());
      submitData.append("stockQuantity", productData.stockQuantity.toString());
      submitData.append("categoryId", productData.categoryId);
      if (imageFile) submitData.append("image", imageFile);

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingProductId) {
        await api.patch(`/products/${editingProductId}`, submitData, config);
        toast.success("Cập nhật món thành công!");
      } else {
        await api.post("/products", submitData, config);
        toast.success("Thêm món mới thành công!");
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu món ăn!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGIC DANH MỤC
  const handleOpenCategoryForm = (category?: Category) => {
    if (category) {
      setEditingCategoryId(category.id);
      setCategoryName(category.name);
    } else {
      setEditingCategoryId(null);
      setCategoryName("");
    }
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async () => {
    if (!categoryName.trim()) return toast.error("Vui lòng nhập tên danh mục!");
    const exists = categories.some(
      (c) =>
        c.name.toLowerCase() === categoryName.trim().toLowerCase() &&
        c.id !== editingCategoryId,
    );
    if (exists) return toast.error("Tên danh mục đã tồn tại!");

    try {
      setIsSubmitting(true);
      if (editingCategoryId) {
        await api.patch(`/categories/${editingCategoryId}`, {
          name: categoryName.trim(),
        });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await api.post("/categories", { name: categoryName.trim() });
        toast.success("Thêm danh mục thành công!");
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu danh mục!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGIC XÓA CHUNG
  const handleConfirmDelete = async () => {
    if (!deleteData) return;
    try {
      setIsSubmitting(true);
      if (deleteData.type === "product") {
        await api.delete(`/products/${deleteData.id}`);
        toast.success("Đã xóa món ăn!");
      } else {
        await api.delete(`/categories/${deleteData.id}`);
        toast.success("Đã xóa danh mục!");
      }
      setDeleteData(null);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Lỗi không thể xóa (Có thể dữ liệu đang được sử dụng)!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Quản lý Thực đơn & Danh mục
          </h2>
          <p className="text-muted-foreground mt-1">
            Cấu hình các món ăn, đồ uống và phân loại nhóm.
          </p>
        </div>
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

        {/* ======================= TAB 1: SẢN PHẨM ======================= */}
        <TabsContent value="products" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  Sản phẩm ({filteredProducts.length})
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm món ăn..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => handleOpenProductForm()}>
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
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-center p-2">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            className="w-12 h-12 object-cover rounded-md border shadow-sm mx-auto"
                            alt="img"
                          />
                        ) : (
                          <div className="w-12 h-12 mx-auto bg-muted rounded-md flex items-center justify-center text-xl shadow-sm border">
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
                          onClick={() => handleOpenProductForm(p)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() =>
                            setDeleteData({ id: p.id, type: "product" })
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

        {/* ======================= TAB 2: DANH MỤC ======================= */}
        <TabsContent value="categories" className="space-y-4 m-0 outline-none">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  Nhóm Danh mục ({filteredCategories.length})
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm danh mục..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleOpenCategoryForm()}
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
                      Số món ăn (Sản phẩm)
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((c) => (
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
                          onClick={() => handleOpenCategoryForm(c)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() =>
                            setDeleteData({ id: c.id, type: "category" })
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

      {/* MODAL MÓN ĂN */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Sửa món ăn" : "Thêm món mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
              {previewImage ? (
                <img
                  src={previewImage}
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
                  onChange={handleImageChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên món</label>
              <Input
                value={productData.name}
                onChange={(e) =>
                  setProductData({ ...productData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục</label>
              <select
                className="flex h-10 w-full rounded-md border px-3"
                value={productData.categoryId}
                onChange={(e) =>
                  setProductData({ ...productData, categoryId: e.target.value })
                }
              >
                <option value="" disabled>
                  -- Chọn --
                </option>
                {categories.map((c) => (
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
                  value={productData.price}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tồn kho</label>
                <Input
                  type="number"
                  value={productData.stockQuantity}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      stockQuantity: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitProduct} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DANH MỤC */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? "Sửa Danh mục" : "Tạo Danh mục"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tên danh mục..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitCategory()}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitCategory} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <Dialog
        open={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Dữ liệu đã xóa không thể phục hồi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteData(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
