import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem, Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Global style for all text in My Page
const blackTextStyle = { color: "#000000 !important", fontWeight: 800 };
const blackIconStyle = { color: "#000000" };
import {
  formatPrice,
  formatOrderId,
  formatDate,
  getOrderStatusColor,
  translateOrderStatus,
  getOrderStatusText,
} from "@/lib/utils";
import {
  Loader2,
  LogOut,
  ShoppingCart,
  PackageOpen,
  ChefHat,
} from "lucide-react";
import { useLocation } from "wouter";
import { GeneratedMealKitCard } from "@/components/generated-meal-kit-card";

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

// Interface for meal kit components
interface GeneratedMealKitComponent {
  id: number;
  generatedMealKitId: number;
  productId: number;
  quantity: string;
  price: string;
  product: {
    id: number;
    name: string;
    category: string;
    price: string;
    imageUrl: string;
    description: string;
  };
}

// Interface for meal kits
interface GeneratedMealKit {
  id: number;
  userId: number | null;
  sessionId: string | null;
  name: string;
  totalPrice: string;
  isAddedToCart: boolean;
  createdAt: string;
  components: GeneratedMealKitComponent[];
}

export default function MyPage() {
  const { user, logoutMutation } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"orders" | "meal-kits">("orders");

  // Fetch user orders
  const {
    data: orders,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/user/orders"], // Changed queryKey to match API endpoint causing automatic invalidation when other components invalidate this key
    queryFn: async () => {
      try {
        if (!user) return [];
        return await apiRequest("GET", "/api/user/orders");
      } catch (err) {
        console.error("Error fetching orders:", err);
        return [];
      }
    },
    enabled: !!user,
    refetchOnMount: true,
  });

  // Fetch user's generated meal kits
  const {
    data: mealKits,
    isLoading: isMealKitsLoading,
    error: mealKitsError,
  } = useQuery<GeneratedMealKit[]>({
    queryKey: ["generated-meal-kits", user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        // Note: this endpoint might need to be verified or created if it doesn't exist yet for user-specific fetching
        // Assuming /api/generated-meal-kits filters by user session/id internally as seen in worker/api/shop.ts
        return await apiRequest("GET", "/api/generated-meal-kits");
      } catch (err) {
        console.error("Error fetching meal kits:", err);
        return [];
      }
    },
    enabled: !!user,
    refetchOnMount: true,
  });

  // Fetch bank account settings
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      try {
        const accounts = await apiRequest("GET", "/api/bank-accounts");
        return accounts.map((acc: any) => ({
          bankName: acc.bankName, // API returns camelCase
          accountNumber: acc.accountNumber,
          accountHolder: acc.accountHolder,
        }));
      } catch (err) {
        console.error("Error fetching bank accounts:", err);
        return [];
      }
    },
  });

  const handleLogout = async () => {
    try {
      console.log("Initiating logout from my-page");
      await logoutMutation.mutateAsync();
      console.log("Logout mutation completed, redirecting to home page");

      // Force reload the page instead of just changing location
      // This ensures all React Query cache and state is completely reset
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Sort orders by date (newest first)
  const sortedOrders = orders
    ? [...orders].sort((a, b) => {
        // Handle null createdAt values gracefully
        const dateA = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const dateB = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return dateA - dateB;
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page header with Red-Blue gradient */}
      <div className="w-full bg-[#E8442E] py-8 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-md">
            {t.myPage}
          </h1>
          <div className="w-20 h-1 bg-white/50 mx-auto mt-4 rounded-full"></div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 pb-12 -mt-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* User Profile Section */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <Card className="gradient-card border-none shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full"></div>
              <CardHeader>
                <CardTitle
                  className="relative font-bold"
                  style={blackTextStyle}
                >
                  {t.userInfo}
                </CardTitle>
                <CardDescription className="relative" style={blackTextStyle}>
                  {t.userInfoDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4 relative">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="my-page-avatar">
                        {user.name
                          ? user.name.charAt(0)
                          : user.username.charAt(0)}
                      </div>
                      <div>
                        <h3
                          className="text-lg font-medium"
                          style={blackTextStyle}
                        >
                          {user.name || user.username}
                        </h3>
                        <p className="text-sm" style={blackTextStyle}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                      <div className="text-sm flex items-start">
                        <span
                          className="font-medium w-1/3"
                          style={blackTextStyle}
                        >
                          {t.name}:
                        </span>
                        <span className="w-2/3" style={blackTextStyle}>
                          {user.username}
                        </span>
                      </div>
                      {user.phone && (
                        <div className="text-sm flex items-start">
                          <span
                            className="font-medium w-1/3"
                            style={blackTextStyle}
                          >
                            {t.phone}:
                          </span>
                          <span className="w-2/3" style={blackTextStyle}>
                            {user.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleLogout}
                      className="my-page-logout-btn"
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      {t.logout}
                    </Button>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order History Section */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <Card className="gradient-card border-none shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
              <CardHeader>
                <CardTitle
                  className="relative font-bold"
                  style={blackTextStyle}
                >
                  {t.orderHistory}
                </CardTitle>
                <CardDescription className="relative" style={blackTextStyle}>
                  {t.orderHistoryDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-4" style={blackTextStyle}>
                      {t.loadingOrderHistory}
                    </p>
                  </div>
                ) : ordersError ? (
                  <div className="py-12 text-center">
                    <p className="text-red-500">
                      {t.error}: {ordersError.message}
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-[#E8442E] text-white hover:opacity-90"
                    >
                      {t.retry}
                    </Button>
                  </div>
                ) : sortedOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#E8442E] flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-10 w-10 text-white" />
                    </div>
                    <h3
                      className="text-lg font-medium mb-2"
                      style={blackTextStyle}
                    >
                      {t.noOrders}
                    </h3>
                    <p className="mb-4" style={blackTextStyle}>
                      {t.noOrdersDesc}
                    </p>
                    <Button
                      onClick={() => setLocation("/")}
                      className="mt-2 bg-[#E8442E] text-white hover:brightness-105 transition-all"
                    >
                      {t.viewProducts}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        bankAccounts={bankAccounts}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Enhanced Order Card Component with detailed information and collapsible view
function OrderCard({
  order,
  bankAccounts,
}: {
  order: OrderWithItems;
  bankAccounts?: any;
}) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  // Calculate order summary data
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Toggle expanded view
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const statusColor = getOrderStatusColor(order.status);
  const statusText =
    t.orderStatus[order.status as keyof typeof t.orderStatus] || order.status;

  return (
    <Card className="overflow-hidden border-none shadow-md gradient-card">
      <div
        className="absolute top-0 left-0 h-full w-1"
        style={{ backgroundColor: statusColor }}
      ></div>
      <div className="p-4 sm:p-6 relative">
        {/* Order header with summary information */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg" style={blackTextStyle}>
                {formatOrderId(order.id)}
              </h3>
              <span
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  backgroundColor: `${statusColor}40`,
                  color: statusColor,
                }}
              >
                {statusText}
              </span>
            </div>
            <p className="text-sm" style={blackTextStyle}>
              {t.orderDate}:{" "}
              {order.createdAt ? formatDate(order.createdAt) : t.orderDate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={blackTextStyle}>
              {formatPrice(order.totalAmount)}
            </div>
            <p className="text-sm" style={blackTextStyle}>
              {t.totalItems} {totalItems} {t.orderedProducts.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Order items preview (collapsed view) */}
        {!expanded && (
          <div className="flex flex-wrap gap-2 mb-4">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-white/50 p-1 px-2 rounded"
              >
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PackageOpen className="w-6 h-6 m-2 text-gray-400" />
                  )}
                </div>
                <div className="text-sm" style={blackTextStyle}>
                  <span className="font-medium">{item.quantity}x</span>{" "}
                  {item.product.name}
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div
                className="text-sm self-center ml-2 bg-white/30 p-1 px-3 rounded-full"
                style={blackTextStyle}
              >
                +{order.items.length - 3} {t.showMore}
              </div>
            )}
          </div>
        )}

        {/* Expanded order details */}
        {expanded && (
          <div className="mt-4 space-y-6">
            {/* All order items in detail */}
            <div className="space-y-4">
              <h4
                className="font-medium text-sm flex items-center gap-2"
                style={{ color: "black", fontWeight: 800 }}
              >
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <PackageOpen className="w-3.5 h-3.5 text-blue-600" />
                </span>
                <span style={{ color: "black", fontWeight: 800 }}>
                  {t.orderedProducts}
                </span>
              </h4>
              <div className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white/80 backdrop-blur-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PackageOpen className="w-8 h-8 m-2 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5
                        className="font-medium"
                        style={{ color: "black", fontWeight: 800 }}
                      >
                        {item.product.name}
                      </h5>
                      <p
                        className="text-sm"
                        style={{ color: "black", fontWeight: 800 }}
                      >
                        {item.product.category && `${item.product.category} • `}
                        {formatPrice(Number(item.price))} x {item.quantity}
                      </p>
                    </div>
                    <div
                      className="font-semibold"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {formatPrice(Number(item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary and payment details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <h4
                  className="font-medium text-sm flex items-center gap-2 mb-2"
                  style={{ color: "black", fontWeight: 800 }}
                >
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="material-icons text-red-600 text-xs">
                      home
                    </span>
                  </span>
                  <span style={{ color: "black", fontWeight: 800 }}>
                    {t.deliveryInfo}
                  </span>
                </h4>
                <div className="space-y-2 text-sm bg-white/60 p-3 rounded-md">
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {t.recipient}:
                    </span>{" "}
                    <span
                      className="w-2/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {order.customerName}
                    </span>
                  </p>
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {t.phone}:
                    </span>{" "}
                    <span
                      className="w-2/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {order.customerPhone}
                    </span>
                  </p>
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {t.email}:
                    </span>{" "}
                    <span
                      className="w-2/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {order.customerEmail}
                    </span>
                  </p>
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {t.address}:
                    </span>{" "}
                    <span
                      className="w-2/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {order.customerAddress}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h4
                  className="font-medium text-sm flex items-center gap-2 mb-2"
                  style={{ color: "black", fontWeight: 800 }}
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="material-icons text-blue-600 text-xs">
                      payments
                    </span>
                  </span>
                  <span style={{ color: "black", fontWeight: 800 }}>
                    {t.paymentInfo}
                  </span>
                </h4>
                <div className="space-y-2 text-sm bg-white/60 p-3 rounded-md">
                  {bankAccounts &&
                  Array.isArray(bankAccounts) &&
                  bankAccounts.length > 0 ? (
                    bankAccounts.map((account: any, index: number) => (
                      <div
                        key={index}
                        className="ml-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-1"
                      >
                        <p className="flex">
                          <span
                            className="font-medium w-1/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {t.bank}:
                          </span>{" "}
                          <span
                            className="w-2/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {account.bankName}
                          </span>
                        </p>
                        <p className="flex">
                          <span
                            className="font-medium w-1/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {t.accountHolder}:
                          </span>{" "}
                          <span
                            className="w-2/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {account.accountHolder}
                          </span>
                        </p>
                        <p className="flex">
                          <span
                            className="font-medium w-1/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {t.accountNumber}:
                          </span>{" "}
                          <span
                            className="w-2/3"
                            style={{ color: "black", fontWeight: 700 }}
                          >
                            {account.accountNumber}
                          </span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="ml-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p style={{ color: "black", fontWeight: 700 }}>
                        {t.loadingBankInfo}
                      </p>
                    </div>
                  )}
                  <p className="flex items-center">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {t.paymentStatus}:
                    </span>
                    <span className="w-2/3">
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {statusText}
                      </span>
                    </span>
                  </p>
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      Захиалгын дугаар:
                    </span>{" "}
                    <span
                      className="w-2/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {formatOrderId(order.id)}
                    </span>
                  </p>
                  <p className="flex">
                    <span
                      className="font-medium w-1/3"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      Нийт дүн:
                    </span>{" "}
                    <span
                      className="w-2/3 font-semibold"
                      style={{ color: "black", fontWeight: 800 }}
                    >
                      {formatPrice(order.totalAmount)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={toggleExpand}
            className={
              expanded
                ? "border-blue-200 text-blue-700 hover:bg-blue-50 transition-all"
                : "bg-[#E8442E] text-white hover:brightness-105 transition-all"
            }
            size="sm"
          >
            {expanded ? <>{t.collapse}</> : <>{t.showDetails}</>}
          </Button>
        </div>
      </div>
    </Card>
  );
}
