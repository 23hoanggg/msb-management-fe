/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const useMenuManagement = () => {
  // 1. DATA STATES
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 2. PRODUCT FORM STATES
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

  // 3. CATEGORY FORM STATES
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState("");

  // 4. DELETE MODAL STATES
  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: "product" | "category";
  } | null>(null);

  // --- API FETCHING ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories").catch(() => ({ data: { data: [] } })),
      ]);
      setProducts(productsRes.data?.data || productsRes.data || []);
      setCategories(categoriesRes.data?.data || categoriesRes.data || []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PRODUCT LOGIC ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleOpenProductForm = (product?: any) => {
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

  // --- CATEGORY LOGIC ---
  const handleOpenCategoryForm = (category?: any) => {
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

  // --- DELETE LOGIC ---
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
      toast.error(error.response?.data?.message || "Lỗi không thể xóa!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPUTED ---
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return {
    states: {
      loading,
      searchTerm,
      categories,
      isSubmitting,
      isProductModalOpen,
      editingProductId,
      productData,
      previewImage,
      isCategoryModalOpen,
      editingCategoryId,
      categoryName,
      deleteData,
    },
    computed: { filteredProducts, filteredCategories },
    setters: {
      setSearchTerm,
      setIsProductModalOpen,
      setProductData,
      setIsCategoryModalOpen,
      setCategoryName,
      setDeleteData,
    },
    actions: {
      handleImageChange,
      handleOpenProductForm,
      handleSubmitProduct,
      handleOpenCategoryForm,
      handleSubmitCategory,
      handleConfirmDelete,
    },
  };
};
