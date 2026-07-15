import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatOrderId, formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/use-order-notifications";

export default function AdminDashboard() {
  const { toast } = useToast();

  // Use order notifications
  const { pendingCount } = useOrderNotifications();

  // Fetch stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/orders/stats");
    },
  });

  // Fetch recent orders
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<any[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      // We can reuse the orders endpoint, maybe add a limit query param later
      // For now fetching all and slicing is fine for low volume
      return await apiRequest("GET", "/api/orders");
    },
  });

  // Get recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  const totalOrders = stats?.totalOrders || 0;
  const totalSales = stats?.totalSales || 0;
  const totalProducts = stats?.totalProducts || 0;
  const totalCustomers = stats?.totalUsers || 0;

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
        <AdminHeader title="Хянах самбар" />

        <div
          className="p-6 overflow-auto"
          style={{ height: "calc(100vh - 70px)" }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#E8442E] text-white">
                    <span className="material-icons">shopping_basket</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Захиалга</p>
                    <h3 className="font-bold text-2xl">
                      {isStatsLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalOrders
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#E8442E] text-white">
                    <span className="material-icons">receipt_long</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Борлуулалт</p>
                    <h3 className="font-bold text-2xl">
                      {isStatsLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        formatPrice(totalSales).replace("₩", "M₩")
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#E8442E] text-white">
                    <span className="material-icons">inventory_2</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Бүтээгдэхүүн</p>
                    <h3 className="font-bold text-2xl">
                      {isStatsLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalProducts
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#E8442E] text-white">
                    <span className="material-icons">person</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Хэрэглэгч</p>
                    <h3 className="font-bold text-2xl">
                      {isStatsLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalCustomers
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mb-6">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Сүүлийн захиалгууд</h2>
              <Button
                variant="link"
                className="text-[#E8442E] font-medium"
                asChild
              >
                <Link href="/admin/orders">Бүгдийг харах</Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Захиалгын ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Харилцагч
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Бүтээгдэхүүн
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дүн
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлөв
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Огноо
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isOrdersLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="px-6 py-4">
                            <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                          </td>
                        </tr>
                      ))
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Захиалга байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatOrderId(order.id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items
                            ?.map((item: any) => item.product?.name)
                            .join(", ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <OrderStatusBadge
                            status={order.status}
                            orderId={order.id}
                            isEditable={true}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/admin/orders?id=${order.id}`}>
                            <a className="text-[#E8442E] hover:brightness-125 mr-3 font-medium">
                              Харах
                            </a>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Product Management Preview */}
          <Card>
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Бүтээгдэхүүний удирдлага</h2>
              <Button
                className="bg-[#E8442E] hover:brightness-105 text-white font-medium py-2 px-4 rounded flex items-center"
                asChild
              >
                <Link href="/admin/products?new=true">
                  <span className="material-icons mr-2">add</span>
                  Шинэ бүтээгдэхүүн
                </Link>
              </Button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <Link href="/admin/products">
                  <Button
                    variant="outline"
                    className="w-full md:w-auto border-[#E8442E] hover:border-[#E8442E] hover:text-[#E8442E]"
                  >
                    Бүтээгдэхүүний жагсаалт руу очих
                    <span className="material-icons ml-2">arrow_forward</span>
                  </Button>
                </Link>
              </div>

              <div className="bg-amber-50 border border-[#E8442E]/20 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <span className="material-icons text-[#E8442E] mr-2">
                    info
                  </span>
                  <div>
                    <h3 className="font-bold text-[#E8442E]">
                      Өнөөдрийн статистик
                    </h3>
                    <p className="text-sm text-gray-700">
                      Нийт {totalProducts} төрлийн бүтээгдэхүүнтэй,{" "}
                      {totalOrders} захиалга хүлээн авсан. Одоогоор{" "}
                      {totalCustomers} харилцагч бүртгэлтэй байна. Бүх
                      бүтээгдэхүүн, захиалга, хэрэглэгчийн мэдээллийг
                      дэлгэрэнгүй харахыг хүсвэл дээрх цэснээс сонгоно уу.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
