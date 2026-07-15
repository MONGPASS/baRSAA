import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductForm } from "@/components/admin/product-form";
import { formatPrice } from "@/lib/utils";
import { MEAT_CATEGORIES } from "@/lib/constants";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getFullImageUrl, handleImageError } from "@/lib/image-utils";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminProducts() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse URL parameters
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );

  // State for product management
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(
    urlParams.get("new") === "true",
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/products");
    },
  });

  // Filtered products based on search and category
  const filteredProducts = products.filter((product) => {
    // Apply category filter
    if (categoryFilter !== "all" && product.category !== categoryFilter) {
      return false;
    }

    // Apply search filter
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Handlers
  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsAddingProduct(true);

    // Update URL without full navigation
    const newUrl = window.location.pathname + "?new=true";
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleEditProduct = async (product: Product) => {
    try {
      // Fetch the latest product data to ensure we have the most up-to-date information
      const updatedProduct = await apiRequest(
        "GET",
        `/api/products/${product.id}`,
      );

      // Set the product for editing with the fresh data
      setEditingProduct(updatedProduct);
      setIsAddingProduct(true);
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description:
          "Бүтээгдэхүүн мэдээлэл авах үед алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
      console.error("Error fetching product details:", error);
    }
  };

  const handleFormSuccess = () => {
    setIsAddingProduct(false);
    setEditingProduct(null);

    // Update URL without full navigation
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleFormCancel = () => {
    setIsAddingProduct(false);
    setEditingProduct(null);

    // Update URL without full navigation
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const openDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await apiRequest("DELETE", `/api/products/${productToDelete.id}`);

      // Invalidate queries to reload product list
      queryClient.invalidateQueries({ queryKey: ["products"] });

      toast({
        title: "Бүтээгдэхүүн устгагдлаа",
        description: `"${productToDelete.name}" бүтээгдэхүүн амжилттай устгагдлаа.`,
      });

      closeDeleteConfirm();
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description: "Бүтээгдэхүүн устгах үед алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
        <AdminHeader title="Бүтээгдэхүүний удирдлага" />

        <div
          className="p-6 overflow-auto"
          style={{ height: "calc(100vh - 70px)" }}
        >
          {/* Product Form (Add/Edit) */}
          {isAddingProduct && (
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">
                  {editingProduct
                    ? "Бүтээгдэхүүн засах"
                    : "Шинэ бүтээгдэхүүн нэмэх"}
                </h2>
                <ProductForm
                  product={editingProduct || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </Card>
          )}

          {/* Product List */}
          <Card>
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Бүтээгдэхүүний жагсаалт</h2>
              {!isAddingProduct && (
                <Button
                  className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded flex items-center"
                  onClick={handleAddNewProduct}
                >
                  <span className="material-icons mr-2">add</span>
                  Шинэ бүтээгдэхүүн
                </Button>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="relative mb-4 md:mb-0 md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-icons text-gray-400">search</span>
                  </span>
                  <Input
                    type="text"
                    placeholder="Хайх..."
                    className="pl-10 pr-3 py-2 w-full border rounded"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <label className="mr-2">Ангилал:</label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ангилал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Зураг
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Нэр
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ангилал
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Үнэ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i}>
                            <td colSpan={5} className="px-6 py-4">
                              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            </td>
                          </tr>
                        ))
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {searchQuery || categoryFilter !== "all"
                            ? "Хайлтад тохирох бүтээгдэхүүн олдсонгүй"
                            : "Бүтээгдэхүүн байхгүй байна"}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img
                              src={getFullImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) =>
                                handleImageError(e, product.imageUrl)
                              }
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              className="text-primary hover:text-primary-dark mr-3"
                              onClick={() => handleEditProduct(product)}
                            >
                              Засах
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => openDeleteConfirm(product)}
                            >
                              Устгах
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                {isLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-lg shadow animate-pulse"
                      >
                        <div className="h-20 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">
                    {searchQuery || categoryFilter !== "all"
                      ? "Хайлтад тохирох бүтээгдэхүүн олдсонгүй"
                      : "Бүтээгдэхүүн байхгүй байна"}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="flex p-4 gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={getFullImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-20 h-20 rounded-md object-cover"
                            onError={(e) =>
                              handleImageError(e, product.imageUrl)
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="text-base font-bold text-gray-900 truncate pr-2">
                              {product.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#E8442E]">
                            {formatPrice(product.price)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-primary-dark hover:bg-primary/10 border-primary/20"
                          onClick={() => handleEditProduct(product)}
                        >
                          <span className="material-icons text-sm mr-1">
                            edit
                          </span>
                          Засах
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => openDeleteConfirm(product)}
                        >
                          <span className="material-icons text-sm mr-1">
                            delete
                          </span>
                          Устгах
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination (if needed) */}
              {filteredProducts.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Нийт: {filteredProducts.length} бүтээгдэхүүн
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Бүтээгдэхүүн устгах</DialogTitle>
                <DialogDescription>
                  Та "{productToDelete?.name}" бүтээгдэхүүнийг устгахдаа
                  итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeDeleteConfirm}>
                  Цуцлах
                </Button>
                <Button variant="destructive" onClick={deleteProduct}>
                  Устгах
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
