import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useOrderNotifications } from "@/hooks/use-order-notifications";

export interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  showBackButton?: boolean;
}

export function AdminHeader({
  title,
  description,
  icon,
  showBackButton = true,
}: AdminHeaderProps) {
  // This would come from the admin's session in a real app
  const adminName = "Админ";

  // Use order notifications hook for vibration alerts
  const { pendingCount } = useOrderNotifications();

  // Legacy query for fallback (keeping for compatibility)
  const { data: pendingData } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-orders-count"],
    refetchInterval: 30000, // Refresh every 30 seconds - less frequent for better performance
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const pendingOrdersCount = pendingCount || pendingData?.count || 0;

  return (
    <header className="bg-[#E8442E] shadow">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-4">
        <div className="flex items-center">
          {showBackButton && (
            <Link
              href="/admin"
              className="mr-3 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
          )}
          <div>
            <div className="flex items-center">
              {icon && <div className="mr-2 text-white">{icon}</div>}
              <h1
                className={cn(
                  "font-bold text-white",
                  "text-xl md:text-2xl", // Smaller on mobile, larger on desktop
                )}
              >
                {title}
              </h1>
            </div>
            {description && (
              <p className="text-xs md:text-sm text-white/80 mt-1 line-clamp-2 md:line-clamp-none">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center ml-2">
          {/* Hide admin name on small screens */}
          <span className="hidden md:inline text-sm text-white mr-4">
            Админ: {adminName}
          </span>
          <button className="p-1 md:p-1.5 rounded-full hover:bg-white/10 relative">
            <span className="material-icons text-base md:text-lg text-white">
              notifications
            </span>
            <span
              className={cn(
                "absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center",
                pendingOrdersCount > 0
                  ? "bg-red-500 animate-pulse"
                  : "bg-[#E8442E]",
              )}
            >
              {pendingOrdersCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
