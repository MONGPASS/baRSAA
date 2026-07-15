import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { CartDrawer } from "@/components/cart-drawer";
import { MiniCart } from "@/components/mini-cart";
import { cn } from "@/lib/utils";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SiteNameSettings {
  value: string;
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { items } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Navigation items (admin-managed)
  const { data: navigationItems = [] } = useQuery<any[]>({
    queryKey: ["navigation"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/navigation");
      } catch (error) {
        console.error("Error fetching navigation:", error);
        return [];
      }
    },
  });

  // Product categories for the nav row
  const { data: productCategories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Site name settings (kept for accessibility/SEO)
  const { data: siteSettings } = useQuery<SiteNameSettings>({
    queryKey: ["site-settings", "site-name"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/settings/site-name");
      } catch (error) {
        return { value: "Барс махны дэлгүүр" };
      }
    },
  });

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const categoryLinks = (Array.isArray(productCategories) ? productCategories : [])
    .filter((c: any) => c.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const adminNavLinks = (Array.isArray(navigationItems) ? navigationItems : []).map(
    (item: any) => ({
      href: item.url || `/#${String(item.title || "").toLowerCase()}`,
      label: item.title,
      id: item.id,
    }),
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setLocation("/products");
  };

  return (
    <header className="relative z-30 bg-white">
      {/* ══ Top notice bar ══ */}
      <div className="bg-[#C8281E] text-white text-[11px] sm:text-xs font-semibold overflow-hidden">
        <div className="h-8 flex items-center whitespace-nowrap">
          <div className="flex animate-marquee-x">
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-3 px-6 shrink-0">
                <span>БНСУ-ын бүх хот руу хүргэлт үйлчилгээтэй</span>
                <span className="opacity-60">·</span>
                <span className="opacity-90">Өнөөдөр захиалбал маргааш хүргэнэ</span>
                <span className="opacity-60">·</span>
                <span>Шинэхэн мах, найдвартай хүргэлт</span>
                <span className="opacity-60 px-2">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Header row ══ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Left: mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -ml-2 text-[#262626]"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          <div className="hidden md:block" />

          {/* Center: wordmark */}
          <Link href="/">
            <div className="flex items-baseline gap-1.5 justify-self-center cursor-pointer select-none">
              <span className="text-[26px] sm:text-[34px] font-extrabold text-[#E8442E] tracking-[-1px] leading-none">
                БАРС
              </span>
              <span className="text-[15px] sm:text-[20px] font-bold text-[#262626] leading-none">
                махны дэлгүүр
              </span>
            </div>
          </Link>

          {/* Right: account links + cart */}
          <div className="flex items-center gap-3 sm:gap-4 justify-self-end text-[12.5px] font-semibold text-[#555]">
            <Link href={user ? "/my-page" : "/auth"} className="hidden md:inline">
              {user ? t.profile : "Нэвтрэх"}
            </Link>
            {!user && (
              <Link href="/auth?tab=signup" className="hidden md:inline">
                Бүртгүүлэх
              </Link>
            )}
            <Link href="/contact" className="hidden md:inline">
              Тусламж
            </Link>

            {/* Cart with mini-cart on hover */}
            <div className="relative group">
              <Link href="/cart">
                <div
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg border-[1.5px] border-gray-300 text-[#262626] hover:border-[#E8442E] hover:text-[#E8442E] transition-colors cursor-pointer"
                  aria-label={t.cart}
                >
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#E8442E] text-white rounded-full text-[10px] font-extrabold min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-sm">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </div>
              </Link>
              <div className="hidden md:group-hover:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <MiniCart isVisible={cartItemCount > 0} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Nav row (desktop) ══ */}
      <div className="hidden md:block max-w-[1200px] mx-auto px-6 pt-4 pb-4">
        <div className="flex items-center gap-6">
          {/* Category glyph */}
          <Link href="/products">
            <div className="flex flex-col gap-1 cursor-pointer py-1">
              <span className="w-5 h-0.5 bg-[#262626] block" />
              <span className="w-5 h-0.5 bg-[#262626] block" />
              <span className="w-3.5 h-0.5 bg-[#262626] block" />
            </div>
          </Link>

          {/* Category links */}
          <nav className="flex items-center gap-6 text-[14.5px] font-bold flex-1 overflow-x-auto scrollbar-hide">
            <Link href="/products">
              <span className="text-[#E8442E] flex items-center gap-1 whitespace-nowrap">
                🔥 Зуны хямдрал
              </span>
            </Link>
            {categoryLinks.slice(0, 6).map((cat: any) => (
              <Link key={cat.id} href="/products">
                <span className="whitespace-nowrap hover:text-[#E8442E] transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
            {adminNavLinks.slice(0, 2).map((link: any) => (
              <Link key={link.id} href={link.href}>
                <span className="whitespace-nowrap hover:text-[#E8442E] transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
            <Link href="/contact">
              <span className="border-[1.5px] border-[#262626] rounded-full px-3.5 py-1 text-[13px] whitespace-nowrap hover:bg-[#262626] hover:text-white transition-colors">
                Бидний тухай
              </span>
            </Link>
          </nav>

          {/* Search box */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-[#F4F4F4] rounded-full px-4 py-2.5 w-[260px]"
          >
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Махаа хайх"
              className="text-[13px] bg-transparent outline-none flex-1 placeholder:text-gray-400"
            />
            <button type="submit" aria-label="Search" className="text-gray-500">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ══ Mobile category strip ══ */}
      <div className="md:hidden border-t border-gray-100">
        <div className="flex items-center gap-4 px-4 py-2.5 overflow-x-auto scrollbar-hide text-[13px] font-bold">
          <Link href="/products">
            <span className="text-[#E8442E] whitespace-nowrap">🔥 Хямдрал</span>
          </Link>
          {categoryLinks.slice(0, 8).map((cat: any) => (
            <Link key={cat.id} href="/products">
              <span className="whitespace-nowrap text-[#262626]">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ Mobile dropdown menu ══ */}
      <div
        className={cn(
          "md:hidden bg-white border-t border-gray-100 shadow-sm transition-all duration-200 overflow-hidden",
          isMenuOpen ? "max-h-[80vh]" : "max-h-0",
        )}
      >
        <div className="px-4 py-3 space-y-1">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-[#F4F4F4] rounded-full px-4 py-2.5 mb-2"
          >
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Махаа хайх"
              className="text-sm bg-transparent outline-none flex-1 placeholder:text-gray-400"
            />
          </form>

          <Link href="/products">
            <div
              className="block px-3 py-2.5 rounded-lg text-base font-bold text-[#E8442E]"
              onClick={() => setIsMenuOpen(false)}
            >
              🔥 Зуны хямдрал
            </div>
          </Link>
          {categoryLinks.map((cat: any) => (
            <Link key={cat.id} href="/products">
              <div
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#262626] hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </div>
            </Link>
          ))}
          {adminNavLinks.map((link: any) => (
            <Link key={link.id} href={link.href}>
              <div
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#262626] hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </div>
            </Link>
          ))}

          <div className="pt-2 mt-1 border-t border-gray-100 flex flex-col">
            <Link href="/contact">
              <div
                className="px-3 py-2.5 rounded-lg text-base font-medium text-[#262626] hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Бидний тухай
              </div>
            </Link>
            <Link href={user ? "/my-page" : "/auth"}>
              <div
                className="px-3 py-2.5 rounded-lg text-base font-medium text-[#262626] hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {user ? t.profile : "Нэвтрэх / Бүртгүүлэх"}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Shopping Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
