import { useLocation } from "wouter";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface MobileBottomNavProps {
  cartItemCount?: number;
  onMenuToggle?: () => void;
}

export function MobileBottomNav({ cartItemCount = 0 }: MobileBottomNavProps) {
  const [location, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const isAdminPage = location.startsWith("/admin");
  if (!isMobile || isAdminPage) return null;

  const profilePath = user ? "/my-page" : "/auth";

  const navItems = [
    { icon: Home, label: "Нүүр", path: "/", match: (l: string) => l === "/" },
    {
      icon: LayoutGrid,
      label: "Ангилал",
      path: "/products",
      match: (l: string) => l.startsWith("/products"),
    },
    {
      icon: ShoppingCart,
      label: "Сагс",
      path: "/cart",
      match: (l: string) => l === "/cart",
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
    {
      icon: User,
      label: "Профайл",
      path: profilePath,
      match: (l: string) => l === "/my-page" || l === "/auth",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-stretch px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.match(location);
          return (
            <button
              key={index}
              onClick={() => setLocation(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                isActive ? "text-[#E8442E]" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {item.badge && (
                  <span className="absolute -top-2 -right-2.5 bg-[#E8442E] text-white text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
