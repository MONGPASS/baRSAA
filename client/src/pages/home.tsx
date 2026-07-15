import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  useLanguage,
  getLocalizedProductName,
  getLocalizedProductDescription,
} from "@/contexts/language-context";
import { QuantityModal } from "@/components/quantity-modal";
import {
  calculateDeliveryDate,
  formatDeliveryDate,
  getDeliveryMessage,
  DeliverySettings,
  NonDeliveryDay,
} from "@/lib/delivery-date";
import { Truck, Star, ShoppingBag } from "lucide-react";
import { Review } from "@shared/schema";
import { getFullImageUrl } from "@/lib/image-utils";

export default function HomePage() {
  const [location, setLocation] = useLocation();
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Featured products
  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => await apiRequest("GET", "/api/products"),
    staleTime: 2 * 60 * 1000,
  });

  // Delivery settings + non-delivery days.
  // These endpoints can fall back to the SPA HTML (returning a non-JSON object)
  // when unavailable, so coerce to safe shapes to avoid runtime crashes.
  const { data: deliverySettings } = useQuery<DeliverySettings | null>({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/delivery-settings");
      return data && typeof (data as any).cutoffHour === "number"
        ? (data as DeliverySettings)
        : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: nonDeliveryDays = [] } = useQuery<NonDeliveryDay[]>({
    queryKey: ["non-delivery-days"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/non-delivery-days");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Approved reviews
  const { data: reviewsData = [] } = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => await apiRequest("GET", "/api/reviews"),
    staleTime: 5 * 60 * 1000,
  });

  // Product categories (category management)
  const { data: productCategories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const deliveryDate = useMemo(() => {
    if (!deliverySettings) return null;
    try {
      return calculateDeliveryDate(
        deliverySettings,
        Array.isArray(nonDeliveryDays) ? nonDeliveryDays : [],
      );
    } catch (err) {
      console.error("Delivery date calculation failed:", err);
      return null;
    }
  }, [deliverySettings, nonDeliveryDays]);

  const activeCategories = useMemo(
    () =>
      (Array.isArray(productCategories) ? productCategories : [])
        .filter((c: any) => c.isActive !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    [productCategories],
  );

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

  const handleCloseModal = useCallback(() => {
    setIsQuantityModalOpen(false);
    setSelectedProduct(null);
  }, []);


  const upcomingNonDeliveryDays = useMemo(() => {
    if (!nonDeliveryDays || nonDeliveryDays.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nonDeliveryDays.filter((day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= today && dayDate <= nextWeek;
    });
  }, [nonDeliveryDays]);

  const formatPrice = (price: number | string) =>
    `${parseFloat(price.toString()).toLocaleString()}₩`;

  // ── Ranked recommendation card (Kurly-style list row) ──
  const RankedCard = ({ product, rank }: { product: Product; rank: number }) => {
    const p = product as any;
    const original =
      typeof p.originalPrice === "number" && p.originalPrice > product.price
        ? p.originalPrice
        : null;
    const discount =
      typeof p.discountPercent === "number" && p.discountPercent > 0
        ? p.discountPercent
        : original
          ? Math.round((1 - product.price / original) * 100)
          : null;

    return (
      <div className="flex gap-3.5 items-start p-3 rounded-2xl border border-gray-100 bg-white">
        {/* Image + rank badge */}
        <Link href={`/products/${product.id}`}>
          <div className="relative w-[96px] h-[96px] sm:w-[104px] sm:h-[104px] shrink-0 rounded-[14px] overflow-hidden bg-[#F6F4F0] cursor-pointer">
            <img
              src={getFullImageUrl(product.thumbnailUrl || product.imageUrl)}
              alt={getLocalizedProductName(product, language)}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span className="absolute top-0 left-0 bg-[#E8442E] text-white font-extrabold text-[13px] w-7 h-7 flex items-center justify-center rounded-tl-[14px] rounded-br-[12px]">
              {rank}
            </span>
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/products/${product.id}`}>
              <h3 className="text-[13.5px] font-bold leading-[1.35] line-clamp-2 text-[#262626] cursor-pointer">
                {getLocalizedProductName(product, language)}
              </h3>
            </Link>
            <button
              onClick={() => handleAddToCartClick(product)}
              aria-label={t.addToCart}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border-[1.5px] border-gray-200 text-[#262626] hover:border-[#E8442E] hover:text-[#E8442E] transition-colors"
            >
              <ShoppingBag className="h-[17px] w-[17px]" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {original && (
              <span className="text-[12px] text-gray-300 line-through">
                {formatPrice(original)}
              </span>
            )}
            <span className="flex items-baseline gap-1.5">
              {discount && (
                <span className="text-[#E8442E] font-extrabold text-[15px]">
                  {discount}%
                </span>
              )}
              <span className="font-extrabold text-[16px] text-[#262626]">
                {formatPrice(product.price)}
              </span>
            </span>
          </div>

          {deliveryDate && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <Truck className="h-3 w-3 text-[#E8442E] flex-shrink-0" />
              <span>
                {formatDeliveryDate(deliveryDate, language)}{" "}
                {getDeliveryMessage(language)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const recommended = useMemo(
    () => (Array.isArray(products) ? products.slice(0, 5) : []),
    [products],
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Non-delivery warning */}
      {upcomingNonDeliveryDays.length > 0 && (
        <div className="bg-red-50 border-b-2 border-red-200">
          <div className="max-w-[1200px] mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#C8281E] flex-shrink-0">
                warning
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Хүргэлтийн тухай:
                </p>
                <p className="text-xs text-red-700">
                  {upcomingNonDeliveryDays.map((day, idx) => (
                    <span key={day.id}>
                      {idx > 0 && ", "}
                      {new Date(day.date).toLocaleDateString("mn-MN")} (
                      {day.reason})
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {/* Hero */}
        <div className="pt-4">
          <Hero />
        </div>

        {/* ══ Category grid ══ */}
        {activeCategories.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-3 sm:px-6 pt-9 pb-2">
            <span className="inline-block font-extrabold text-[18px] sm:text-[22px] text-[#262626] sm:text-white sm:bg-[#262626] sm:px-3 sm:py-1 sm:rounded-full ml-1 sm:ml-0">
              Ангиллаар бүтээгдэхүүнээ хайх
            </span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3.5 mt-4">
              {activeCategories.slice(0, 5).map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setLocation("/products")}
                  className="flex flex-col items-center sm:items-stretch gap-1.5 sm:gap-2 group text-center sm:text-left"
                >
                  {/* Mobile: circle · Desktop: rounded rectangle with red scrim */}
                  <div className="relative overflow-hidden bg-[#F6F4F0] w-full aspect-square rounded-full sm:aspect-auto sm:h-24 sm:rounded-[14px] sm:bg-gradient-to-br sm:from-[#E8442E] sm:to-[#F0603F]">
                    {cat.imageUrl ? (
                      <img
                        src={getFullImageUrl(cat.imageUrl)}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#262626] sm:text-white font-extrabold text-[10px] sm:text-sm text-center px-1">
                        {cat.name}
                      </div>
                    )}
                    <div
                      className="hidden sm:block absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(200,40,30,0) 45%,rgba(200,40,30,.55) 100%)",
                      }}
                    />
                  </div>
                  <div className="text-[11px] sm:text-[12.5px] font-bold text-center text-[#262626] leading-tight">
                    {cat.name}
                    <span className="hidden sm:inline"> ›</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══ Recommended products (ranked list) ══ */}
        {recommended.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-8">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[18px] sm:text-[22px] font-extrabold tracking-[-.5px] text-[#262626]">
                Санал болгох бүтээгдэхүүн
              </div>
              <Link href="/products">
                <span className="text-[#E8442E] text-[12.5px] font-bold whitespace-nowrap cursor-pointer hover:underline">
                  Дэлгэрэнгүй →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-5">
              {recommended.map((product, i) => (
                <RankedCard key={product.id} product={product} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* ══ Reviews (auto-scrolling marquee) ══ */}
        {Array.isArray(reviewsData) && reviewsData.length > 0 && (
          <section className="py-10 bg-white overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="text-center mb-6">
                <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-.5px] mb-1">
                  Хэрэглэгчдийн сэтгэгдэл
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  Чанар баталгааг амлая
                </p>
              </div>
            </div>

            {/* Marquee: cards scroll sideways, pause on hover */}
            <div className="overflow-hidden">
              {(() => {
                const list = (
                  Array.isArray(reviewsData) ? reviewsData : []
                ).slice(0, 12);
                const rep = list.length
                  ? Math.max(2, Math.ceil(6 / list.length))
                  : 0;
                const base = Array.from({ length: rep }).flatMap(() => list);
                const loop = [...base, ...base];
                return (
                  <div
                    className="flex gap-4 w-max animate-scroll-x hover:[animation-play-state:paused]"
                    style={{ animationDuration: "60s" }}
                  >
                    {loop.map((review, idx) => (
                      <div
                        key={`${review.id}-${idx}`}
                        className="bg-[#F6F4F0] rounded-2xl p-5 w-[300px] shrink-0"
                        data-testid={`review-card-${review.id}-${idx}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#E8442E] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-bold text-sm truncate">
                                {review.customerName}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < review.rating ? "text-[#F6C544] fill-[#F6C544]" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs line-clamp-3">
                              {review.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* ══ FAQ / A-to-Z cards ══ */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#F6F4F0] rounded-[20px] p-8 flex flex-col gap-4">
              <div className="text-[22px] font-extrabold tracking-[-.5px]">
                Барс махын А-гаас Я
              </div>
              <div className="text-[13px] font-semibold text-gray-500">
                Дэлгүүрийн талаар юу ч асуугаарай
              </div>
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="bg-white rounded-full px-4 py-2.5 text-[12.5px] font-bold w-max shadow-sm">
                  Баярын үеэр хүргэлт хэд хоног болох вэ? 🤔
                </div>
                <div className="bg-white rounded-full px-4 py-2.5 text-[12.5px] font-bold w-max shadow-sm ml-6">
                  Хаягаа буруу оруулсан бол яаж засах вэ?
                </div>
              </div>
              <div className="text-5xl mt-auto">🐆</div>
            </div>
            <div className="flex flex-col gap-5">
              <Link href="/contact">
                <div className="bg-[#E8442E] rounded-[20px] p-8 text-white flex justify-between items-center cursor-pointer hover:brightness-105 transition">
                  <div className="flex flex-col gap-2">
                    <div className="text-xl font-extrabold">Мэдэгдэл</div>
                    <div className="text-[13px] font-semibold opacity-90">
                      Барс махын шинэ мэдээг эндээс шалгаарай
                    </div>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-white text-[#E8442E] flex items-center justify-center text-base font-extrabold">
                    →
                  </span>
                </div>
              </Link>
              <Link href="/contact">
                <div className="bg-[#F6C544] rounded-[20px] p-8 flex justify-between items-center cursor-pointer hover:brightness-105 transition">
                  <div className="flex flex-col gap-2">
                    <div className="text-xl font-extrabold">Түгээмэл асуулт</div>
                    <div className="text-[13px] font-semibold text-[#6b5410]">
                      Анх удаа ирсэн үү? Дэлгүүрийг 200% ашиглах зөвлөгөө
                    </div>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-[#262626] text-white flex items-center justify-center text-base font-extrabold">
                    →
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
}
