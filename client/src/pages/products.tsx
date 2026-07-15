import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { QuantityModal } from "@/components/quantity-modal";
import { Search, Star, Truck, ChevronDown, Plus } from "lucide-react";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  useLanguage,
  getLocalizedProductName,
} from "@/contexts/language-context";
import { getFullImageUrl } from "@/lib/image-utils";

const PRICE_RANGES = [
  { id: "all", label: "Бүх үнэ", min: 0, max: Infinity },
  { id: "u10", label: "10,000₩-аас доош", min: 0, max: 10000 },
  { id: "10-20", label: "10,000₩ - 20,000₩", min: 10000, max: 20000 },
  { id: "o20", label: "20,000₩-аас дээш", min: 20000, max: Infinity },
];

const SORTS = [
  { id: "name", label: "Нэрээр" },
  { id: "price-low", label: "Үнэ: Бага → Их" },
  { id: "price-high", label: "Үнэ: Их → Бага" },
];

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => await apiRequest("GET", "/api/products"),
  });

  // Categories (with images) for the circular tab row
  const { data: apiCategories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryTabs = useMemo(() => {
    const active = (Array.isArray(apiCategories) ? apiCategories : [])
      .filter((c: any) => c.isActive !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    if (active.length > 0)
      return active.map((c: any) => ({ name: c.name, imageUrl: c.imageUrl }));
    // Fallback: derive from products
    const seen: Record<string, boolean> = {};
    products.forEach((p) => (seen[p.category] = true));
    return Object.keys(seen)
      .sort()
      .map((name) => ({ name, imageUrl: undefined }));
  }, [apiCategories, products]);

  const filteredProducts = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === priceRange) || PRICE_RANGES[0];
    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q);
      const matchesPrice =
        product.price >= range.min && product.price < range.max;
      return matchesCategory && matchesSearch && matchesPrice;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return filtered;
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  const formatPrice = (price: number | string) =>
    `${parseFloat(price.toString()).toLocaleString()}₩`;

  const handleAddToCartClick = useCallback(
    (product: Product) => {
      if (!user) {
        toast({
          title: t.toast.loginRequired,
          description: t.toast.loginRequiredDesc,
          variant: "default",
        });
        setLocation("/auth?tab=signup");
        return;
      }
      setSelectedProduct(product);
      setIsQuantityModalOpen(true);
    },
    [user, toast, setLocation, t],
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Category tab row */}
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-6 pt-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[64px]"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-extrabold ${
                  selectedCategory === "all"
                    ? "bg-[#E8442E] text-white ring-2 ring-[#E8442E] ring-offset-2"
                    : "bg-[#F6F4F0] text-[#262626]"
                }`}
              >
                Бүгд
              </div>
              <span
                className={`text-[11px] font-bold ${selectedCategory === "all" ? "text-[#E8442E]" : "text-[#262626]"}`}
              >
                Бүгд
              </span>
            </button>

            {categoryTabs.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-[64px]"
                >
                  <div
                    className={`w-14 h-14 rounded-full overflow-hidden bg-[#F6F4F0] ${
                      isActive ? "ring-2 ring-[#E8442E] ring-offset-2" : ""
                    }`}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={getFullImageUrl(cat.imageUrl)}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#262626] px-1 text-center">
                        {cat.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center leading-tight ${isActive ? "text-[#E8442E]" : "text-[#262626]"}`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-6 mt-3">
          <div className="flex items-center gap-2 bg-[#F4F4F4] rounded-full px-4 py-2.5">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Махаа хайх"
              className="text-sm bg-transparent outline-none flex-1 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-6 mt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
            {PRICE_RANGES.filter((r) => r.id !== "all").map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  setPriceRange((prev) => (prev === r.id ? "all" : r.id))
                }
                className={`shrink-0 text-[12.5px] font-bold px-3.5 py-1.5 rounded-full border transition-colors ${
                  priceRange === r.id
                    ? "bg-[#E8442E] text-white border-[#E8442E]"
                    : "bg-white text-[#262626] border-gray-200 hover:border-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white text-[12.5px] font-bold text-[#262626] border border-gray-200 rounded-full pl-3.5 pr-8 py-1.5 outline-none cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-6 mt-5">
          <h2 className="text-[17px] sm:text-[20px] font-extrabold text-[#262626]">
            Нийт {filteredProducts.length} бүтээгдэхүүн
          </h2>
        </div>

        {/* Product grid */}
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-6 mt-4 pb-16">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mt-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
                  </div>
                ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="material-icons text-gray-400 text-3xl">
                  inventory_2
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">Бүтээгдэхүүн олдсонгүй</h3>
              <p className="text-gray-500 text-sm">
                Өөр шүүлтүүр эсвэл түлхүүр үг ашиглан хайж үзээрэй.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {filteredProducts.map((product) => {
                const p = product as any;
                const original =
                  typeof p.originalPrice === "number" &&
                  p.originalPrice > product.price
                    ? p.originalPrice
                    : null;
                const rating =
                  typeof p.rating === "number" ? p.rating : null;
                return (
                  <div key={product.id} className="flex flex-col">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F4F0]">
                      <Link href={`/products/${product.id}`}>
                        <img
                          src={getFullImageUrl(
                            product.thumbnailUrl || product.imageUrl,
                          )}
                          alt={getLocalizedProductName(product, language)}
                          className="w-full h-full object-cover cursor-pointer"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                      {rating != null && (
                        <span className="absolute bottom-2 left-2 bg-white/95 rounded-lg px-1.5 py-0.5 flex items-center gap-0.5 text-[11px] font-extrabold shadow-sm">
                          <Star className="h-3 w-3 text-[#3BB54A] fill-[#3BB54A]" />
                          {rating.toFixed(1)}
                          {typeof p.ratingCount === "number" && (
                            <span className="text-gray-400 font-semibold">
                              ({p.ratingCount})
                            </span>
                          )}
                        </span>
                      )}
                      {/* Add-to-cart plus button on the image */}
                      <button
                        onClick={() => handleAddToCartClick(product)}
                        aria-label={t.addToCart}
                        className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full bg-white border-[1.5px] border-[#E8442E] text-[#E8442E] flex items-center justify-center shadow-md hover:bg-[#E8442E] hover:text-white transition-colors active:scale-95"
                      >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                    </div>

                    <h3 className="mt-2 text-[13px] font-bold leading-[1.35] line-clamp-2 min-h-[36px] text-[#262626]">
                      {getLocalizedProductName(product, language)}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-1">
                      {original && (
                        <span className="text-[12px] text-gray-400 line-through">
                          {formatPrice(original)}
                        </span>
                      )}
                      <span className="text-[15px] font-extrabold text-[#E8442E] bg-[#FDECEA] px-1 rounded w-max">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400">
                      <span className="font-semibold">Барс мах</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Truck className="h-3 w-3" /> Маргааш хүргэнэ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => {
          setIsQuantityModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
}
