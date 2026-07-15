import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { clearAuthToken } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { Menu, X } from "lucide-react";

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use order notifications hook (browser notifications removed)
  const { pendingCount } = useOrderNotifications();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Fetch only pending orders count for better performance (legacy)
  const { data: pendingData } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-orders-count"],
    refetchInterval: 30000, // Refresh every 30 seconds - less frequent for better performance
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use count from notification hook for consistency
  const pendingOrdersCount = pendingCount;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout", {});
    } catch (error) {
      // 서버 호출이 실패해도 로컬 세션은 정리한다
      console.error("Admin logout API error:", error);
    } finally {
      // 토큰(앱)·쿠키(웹) 모두 정리 후 클라이언트 라우팅으로 이동 (하드 네비게이션은 앱에서 404)
      clearAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      setLocation("/admin/login");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { path: "/admin", icon: "dashboard", label: "Хянах самбар" },
    { path: "/admin/products", icon: "inventory", label: "Бүтээгдэхүүн" },
    {
      path: "/admin/orders",
      icon: "shopping_bag",
      label: "Захиалгууд",
      notificationCount: pendingOrdersCount,
    },
    { path: "/admin/users", icon: "people", label: "Хэрэглэгчид" },
    {
      path: "/admin/bank-accounts",
      icon: "account_balance",
      label: "Банкны данс",
    },
    { path: "/admin/settings", icon: "settings", label: "Тохиргоо" },
    // CMS sections
    // "Сайтын агуулга" 링크가 제거되었습니다
    {
      path: "/admin/hero-settings",
      icon: "featured_video",
      label: "Нүүр хуудас зураг",
    },
    {
      path: "/admin/login-settings",
      icon: "image",
      label: "Нэвтрэх хэсгийн зураг",
    },

    { path: "/admin/categories", icon: "category", label: "Ангилал" },
    {
      path: "/admin/delivery-settings",
      icon: "local_shipping",
      label: "Хүргэлтийн тохиргоо",
    },
    { path: "/admin/reviews", icon: "reviews", label: "Сэтгэгдлүүд" },
  ];

  // Mobile menu toggle button displayed at the top of the screen
  const mobileMenuToggle = (
    <div className="md:hidden fixed top-0 left-0 z-50 w-full bg-[#E8442E] p-3 shadow-md flex justify-between items-center">
      <div className="flex items-center">
        <span className="material-icons text-white text-2xl mr-2">
          admin_panel_settings
        </span>
        <span className="font-bold text-white">Админ Удирдлага</span>
      </div>
      <button
        onClick={toggleMobileMenu}
        className="p-1 rounded-md text-white hover:bg-white/10"
        aria-label={isMobileMenuOpen ? "Цэсийг хаах" : "Цэсийг нээх"}
      >
        {isMobileMenuOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Menu size={24} className="text-white" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {mobileMenuToggle}

      {/* Mobile Sidebar - Drawer that slides in from left */}
      <div
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-40 w-80 md:w-64 bg-[#E8442E] text-white shadow-xl transform transition-transform duration-300",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Fixed height for desktop, scrollable for mobile */}
        <div className="flex flex-col h-full md:h-screen">
          {/* Sidebar Header - Only visible on desktop */}
          <div className="hidden md:block p-4 border-b border-white/10">
            <div className="flex items-center">
              <span className="material-icons text-white text-3xl mr-2">
                admin_panel_settings
              </span>
              <span className="font-bold text-lg text-white">
                Админ Удирдлага
              </span>
            </div>
          </div>

          {/* Mobile header spacer to prevent content from being under the fixed top bar */}
          <div className="h-16 md:hidden"></div>

          {/* Menu Items - Scrollable */}
          <nav className="flex-1 overflow-y-auto pt-2 md:pt-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3 md:py-2.5 transition-colors duration-200",
                  location === item.path
                    ? "bg-white/10 text-white border-l-4 border-white"
                    : "text-white/80 hover:bg-white/5 hover:border-l-4 hover:border-white/50 hover:text-white",
                )}
              >
                <div className="flex items-center">
                  <span
                    className={cn(
                      "material-icons mr-3",
                      location === item.path ? "text-white" : "text-white/80",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm md:text-base">{item.label}</span>
                </div>
                {item.notificationCount !== undefined &&
                  item.notificationCount > 0 && (
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg ring-2 ring-yellow-300">
                      {item.notificationCount > 99
                        ? "99+"
                        : item.notificationCount}
                    </span>
                  )}
              </Link>
            ))}
          </nav>

          {/* Navigation and Logout Buttons - Sticky at bottom */}
          <div className="border-t border-white/10 mt-auto">
            <Link
              href="/"
              className="flex items-center w-full px-4 py-4 md:py-3 text-white/80 hover:bg-white/5 hover:border-l-4 hover:border-white/50 hover:text-white transition-all duration-200"
            >
              <span className="material-icons mr-3 text-white/80">home</span>
              <span className="text-sm md:text-base">Нүүр хуудас руу очих</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-4 md:py-3 text-white/80 hover:bg-white/5 hover:border-l-4 hover:border-white/50 hover:text-white transition-all duration-200 text-left"
            >
              <span className="material-icons mr-3 text-white/80">logout</span>
              <span className="text-sm md:text-base">Гарах</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay - only shown on mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
