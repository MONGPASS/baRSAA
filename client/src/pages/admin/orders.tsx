import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useLanguage } from "@/contexts/language-context";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatOrderId, formatPrice, formatDate, isBulkyMeat } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// SMS message templates based on order status
const SMS_TEMPLATES: Record<string, (amount: string) => string> = {
  pending: (amount) =>
    `[Арвижих махны дэлгүүр] Таны ${amount} төлбөр төлөгдөөгүй байна. Төлбөрөө баталгаажуулна уу.`,
  payment_confirmed: (amount) =>
    `[Арвижих махны дэлгүүр] Таны ${amount} төлбөр төлөгдлөө. Захиалга бэлтгэгдэж байна.`,
  processing: (amount) =>
    `[Арвижих махны дэлгүүр] Таны ${amount} төлбөр төлөгдлөө. Захиалга бэлтгэгдэж байна.`,
  shipped: () => `[Арвижих махны дэлгүүр] Таны захиалга хүргэлтэд гарлаа.`,
  delivered: () =>
    `[Арвижих махны дэлгүүр] Таны захиалга амжилттай хүргэгдлээ. Баярлалаа.`,
  cancelled: () => `[Арвижих махны дэлгүүр] Таны захиалга цуцлагдсан байна.`,
};

export default function AdminOrders() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Parse URL parameters to see if we need to open a specific order
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const orderIdParam = urlParams.get("id");

  const queryClient = useQueryClient();

  // State for filtering and order details
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    orderIdParam ? parseInt(orderIdParam) : null,
  );
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(!!orderIdParam);

  // SMS dialog state
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsOrder, setSmsOrder] = useState<Order | null>(null);

  // Delete dialog state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Format dates for API queries
  const formatDateForQuery = (date?: Date) => {
    return date ? format(date, "yyyy-MM-dd") : undefined;
  };

  // Define types for orders and items
  interface OrderItem {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: string | number;
    product: {
      id: number;
      name: string;
      description: string;
      category: string;
      price: string | number;
      imageUrl: string;
      stock: number;
    };
  }

  interface Order {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    totalAmount: string | number;
    status: string;
    createdAt: string;
    userId: number | null;
    items: OrderItem[];
  }

  // Fetch orders with date filters and improved refresh settings
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [
      "/api/orders",
      formatDateForQuery(startDate),
      formatDateForQuery(endDate),
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) {
        // Add one day to end date to include the whole day
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        params.append("endDate", nextDay.toISOString());
      }

      const queryString = params.toString();
      const url = `/api/orders${queryString ? `?${queryString}` : ""}`;

      return await apiRequest("GET", url);
    },
    refetchInterval: 15000, // Refresh every 15 seconds for orders page
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Амжилттай",
        description: "Захиалга устгагдлаа.",
      });
      setOrderToDelete(null);
    },
    onError: () => {
      toast({
        title: "Алдаа",
        description: "Захиалга устгахад алдаа гарлаа.",
        variant: "destructive",
      });
    },
  });

  // Selected order for detailed view
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  // Filtered orders based on search and status
  const filteredOrders = orders.filter((order) => {
    // Apply status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Apply search filter (on order ID or customer name)
    if (searchQuery) {
      const orderIdString = formatOrderId(order.id);
      const searchLower = searchQuery.toLowerCase();
      return (
        orderIdString.includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Open order details
  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDetailsOpen(true);

    // Update URL without full navigation
    const newUrl = window.location.pathname + `?id=${orderId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  // Close order details
  const handleCloseDetails = () => {
    setOrderDetailsOpen(false);

    // Update URL without full navigation
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-neutral flex">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
        <AdminHeader title="Захиалгын удирдлага" />

        <div
          className="p-6 overflow-auto"
          style={{ height: "calc(100vh - 70px)" }}
        >
          <Card>
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Захиалгын жагсаалт</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Search Input */}
                <div className="relative">
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

                {/* Start Date Picker */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <span className="material-icons mr-2 text-gray-400">
                          event
                        </span>
                        {startDate
                          ? format(startDate, "yyyy-MM-dd")
                          : "Эхлэх огноо"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date || undefined);
                          // If end date is before start date, reset it
                          if (date && endDate && date > endDate) {
                            setEndDate(undefined);
                          }
                        }}
                        initialFocus
                      />
                      {startDate && (
                        <div className="p-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => setStartDate(undefined)}
                          >
                            Цэвэрлэх
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date Picker */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <span className="material-icons mr-2 text-gray-400">
                          event
                        </span>
                        {endDate
                          ? format(endDate, "yyyy-MM-dd")
                          : "Дуусах огноо"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) =>
                          startDate ? date < startDate : false
                        }
                      />
                      {endDate && (
                        <div className="p-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => setEndDate(undefined)}
                          >
                            Цэвэрлэх
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status Filter */}
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Төлөв сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {t.orderStatus[
                            status.value as keyof typeof t.orderStatus
                          ] || status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                        Утас
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
                    {isLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            </td>
                          </tr>
                        ))
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {searchQuery || statusFilter !== "all"
                            ? "Хайлтад тохирох захиалга олдсонгүй"
                            : "Захиалга байхгүй байна"}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatOrderId(order.id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customerPhone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <OrderStatusBadge
                                status={order.status}
                                orderId={order.id}
                                isEditable={true}
                                forceLanguage="mn"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                onClick={() => {
                                  setSmsOrder(order);
                                  setSmsDialogOpen(true);
                                }}
                                title="SMS илгээх"
                                data-testid={`button-sms-${order.id}`}
                              >
                                <span className="material-icons text-lg">
                                  sms
                                </span>
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                className="text-primary hover:text-primary-dark"
                                onClick={() => handleViewOrder(order.id)}
                              >
                                Харах
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-8 w-8"
                                onClick={() => setOrderToDelete(order)}
                                title="Устгах"
                              >
                                <span className="material-icons text-lg">delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (if needed) */}
              {filteredOrders.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Нийт: {filteredOrders.length} захиалга
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Order Details Modal */}
          <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Захиалгын дэлгэрэнгүй</DialogTitle>
              </DialogHeader>

              {selectedOrder ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Захиалгын мэдээлэл</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="text-sm text-gray-500">Захиалгын ID:</p>
                          <p className="text-sm font-medium">
                            {formatOrderId(selectedOrder.id)}
                          </p>

                          <p className="text-sm text-gray-500">Огноо:</p>
                          <p className="text-sm font-medium">
                            {formatDate(selectedOrder.createdAt)}
                          </p>

                          <p className="text-sm text-gray-500">
                            Захиалсан цаг:
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">
                              {selectedOrder.createdAt
                                ? format(
                                  new Date(selectedOrder.createdAt),
                                  "HH:mm",
                                )
                                : "-"}
                            </p>
                            {selectedOrder.createdAt &&
                              (() => {
                                const orderDate = new Date(
                                  selectedOrder.createdAt,
                                );
                                const orderHour = orderDate.getHours();
                                const orderMinute = orderDate.getMinutes();
                                const isBeforeCutoff =
                                  orderHour < 18 ||
                                  (orderHour === 18 && orderMinute <= 30);

                                return isBeforeCutoff ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    18:30 өмнө → Маргааш хүргэнэ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    18:30 дараа → Нөгөөдөр хүргэнэ
                                  </span>
                                );
                              })()}
                          </div>

                          <p className="text-sm text-gray-500">Төлөв:</p>
                          <div>
                            <OrderStatusBadge
                              status={selectedOrder.status}
                              orderId={selectedOrder.id}
                              isEditable={true}
                              forceLanguage="mn"
                            />
                          </div>

                          <p className="text-sm text-gray-500">Нийт дүн:</p>
                          <p className="text-sm font-medium">
                            {formatPrice(selectedOrder.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">
                        Харилцагчийн мэдээлэл
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="text-sm text-gray-500">Нэр:</p>
                          <p className="text-sm font-medium">
                            {selectedOrder.customerName}
                          </p>

                          <p className="text-sm text-gray-500">И-мэйл:</p>
                          <p className="text-sm font-medium">
                            {selectedOrder.customerEmail}
                          </p>

                          <p className="text-sm text-gray-500">Утас:</p>
                          <p className="text-sm font-medium">
                            {selectedOrder.customerPhone}
                          </p>

                          <p className="text-sm text-gray-500">Хаяг:</p>
                          <p className="text-sm font-medium">
                            {selectedOrder.customerAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Захиалсан бүтээгдэхүүн</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Бүтээгдэхүүн
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Үнэ
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Тоо хэмжээ
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Нийт
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="w-10 h-10 rounded object-cover mr-3"
                                  />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {item.product.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.product.category}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {formatPrice(item.price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {item.quantity} кг
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                {formatPrice(
                                  isBulkyMeat(item.product.name)
                                    ? parseFloat(item.price.toString()) * (item.quantity / 4)
                                    : parseFloat(item.price.toString()) * item.quantity,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right font-medium"
                            >
                              Нийт дүн:
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {formatPrice(selectedOrder.totalAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button onClick={handleCloseDetails}>Хаах</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Захиалгын мэдээлэл олдсонгүй</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* SMS Message Dialog */}
          <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="material-icons text-green-600">sms</span>
                  SMS мессеж илгээх
                </DialogTitle>
                <DialogDescription>
                  Доорх мессежийг хуулж, харилцагчид илгээнэ үү
                </DialogDescription>
              </DialogHeader>

              {smsOrder && (
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-icons text-gray-500 text-sm">
                        person
                      </span>
                      <span className="font-medium">
                        {smsOrder.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-500 text-sm">
                        phone
                      </span>
                      <a
                        href={`tel:${smsOrder.customerPhone}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {smsOrder.customerPhone}
                      </a>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Захиалга: {formatOrderId(smsOrder.id)}</span>
                    <span className="font-bold text-primary">
                      {formatPrice(smsOrder.totalAmount)}
                    </span>
                  </div>

                  {/* SMS Message Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Мессеж сонгох:
                    </label>
                    {Object.entries(SMS_TEMPLATES).map(
                      ([status, getMessage]) => {
                        const message = getMessage(
                          formatPrice(smsOrder.totalAmount),
                        );
                        const statusLabels: Record<string, string> = {
                          pending: "Төлбөр хүлээгдэж байна",
                          payment_confirmed: "Төлбөр төлөгдсөн",
                          processing: "Бэлтгэгдэж байна",
                          shipped: "Хүргэлтэд гарсан",
                          delivered: "Хүргэгдсэн",
                          cancelled: "Цуцлагдсан",
                        };

                        return (
                          <div
                            key={status}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-green-500 ${smsOrder.status === status
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                              }`}
                            onClick={() => {
                              const encodedMessage =
                                encodeURIComponent(message);
                              // Use different format for iOS vs Android
                              const isIOS = /iPad|iPhone|iPod/.test(
                                navigator.userAgent,
                              );
                              const smsUrl = isIOS
                                ? `sms:${smsOrder.customerPhone}&body=${encodedMessage}`
                                : `sms:${smsOrder.customerPhone}?body=${encodedMessage}`;
                              window.location.href = smsUrl;
                            }}
                            data-testid={`sms-template-${status}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                {statusLabels[status]}
                              </span>
                              {smsOrder.status === status && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                  Одоогийн төлөв
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800">{message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-blue-600 font-medium">
                                📱 {smsOrder.customerPhone}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <span className="material-icons text-sm">
                                  send
                                </span>
                                Дарж илгээх
                              </span>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Direct SMS Link (for mobile) */}
                  <div className="pt-2 border-t">
                    <a
                      href={`sms:${smsOrder.customerPhone}`}
                      className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      data-testid="button-open-sms-app"
                    >
                      <span className="material-icons">message</span>
                      SMS апп нээх
                    </a>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Захиалга устгах</AlertDialogTitle>
                <AlertDialogDescription>
                  {orderToDelete && (
                    <>
                      Та <strong>{formatOrderId(orderToDelete.id)}</strong> дугаартай захиалгыг устгахдаа итгэлтэй байна уу?
                      <br />
                      Энэ үйлдлийг буцаах боломжгүй бөгөөд захиалгын бүх мэдээлэл устах болно.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteOrderMutation.isPending}>Болих</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  disabled={deleteOrderMutation.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    if (orderToDelete) {
                      deleteOrderMutation.mutate(orderToDelete.id);
                    }
                  }}
                >
                  {deleteOrderMutation.isPending ? "Устгаж байна..." : "Устгах"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
