import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { NonDeliveryDay, DeliverySetting } from "@shared/schema";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { mn } from "date-fns/locale";

import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Truck,
} from "lucide-react";

export default function DeliverySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isRecurringYearly, setIsRecurringYearly] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<NonDeliveryDay | null>(null);

  const [cutoffHour, setCutoffHour] = useState(18);
  const [cutoffMinute, setCutoffMinute] = useState(30);
  const [processingDays, setProcessingDays] = useState(1);

  const { data: nonDeliveryDays = [], isLoading: isLoadingDays } = useQuery<
    NonDeliveryDay[]
  >({
    queryKey: ["non-delivery-days"],
    queryFn: async () => {
      const days = await apiRequest("GET", "/api/non-delivery-days");
      return days.map((day: any) => ({
        ...day,
        date: new Date(day.date),
        createdAt: day.createdAt ? new Date(day.createdAt) : null,
      }));
    },
  });

  const { data: deliverySettings, isLoading: isLoadingSettings } =
    useQuery<DeliverySetting>({
      queryKey: ["delivery-settings"],
      queryFn: async () => {
        const settings = await apiRequest("GET", "/api/delivery-settings");
        return {
          ...settings,
          updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : null,
        };
      },
    });

  useEffect(() => {
    if (deliverySettings) {
      setCutoffHour(deliverySettings.cutoffHour);
      setCutoffMinute(deliverySettings.cutoffMinute);
      setProcessingDays(deliverySettings.processingDays);
    }
  }, [deliverySettings]);

  const createNonDeliveryDayMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      reason: string;
      isRecurringYearly: boolean;
    }) => {
      await apiRequest("POST", "/api/non-delivery-days", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-delivery-days"] });
      toast({
        title: "Хүргэлтгүй өдөр нэмэгдлээ",
        description: "Шинэ хүргэлтгүй өдөр амжилттай тохируулагдлаа.",
      });
      setIsAddDialogOpen(false);
      setSelectedDate(null);
      setReason("");
      setIsRecurringYearly(false);
    },
    onError: () => {
      toast({
        title: "Алдаа гарлаа",
        description: "Хүргэлтгүй өдөр нэмэхэд алдаа гарлаа.",
        variant: "destructive",
      });
    },
  });

  const deleteNonDeliveryDayMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/non-delivery-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-delivery-days"] });
      toast({
        title: "Хүргэлтгүй өдөр устгагдлаа",
        description: "Хүргэлтгүй өдөр амжилттай устгагдлаа.",
      });
      setDayToDelete(null);
    },
    onError: () => {
      toast({
        title: "Алдаа гарлаа",
        description: "Хүргэлтгүй өдөр устгахад алдаа гарлаа.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      cutoffHour: number;
      cutoffMinute: number;
      processingDays: number;
    }) => {
      await apiRequest("PUT", "/api/delivery-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-settings"] });
      toast({
        title: "Тохиргоо хадгалагдлаа",
        description: "Хүргэлтийн тохиргоо амжилттай шинэчлэгдлээ.",
      });
    },
    onError: () => {
      toast({
        title: "Алдаа гарлаа",
        description: "Тохиргоо хадгалахад алдаа гарлаа.",
        variant: "destructive",
      });
    },
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsAddDialogOpen(true);
  };

  const handleAddNonDeliveryDay = () => {
    if (selectedDate && reason.trim()) {
      createNonDeliveryDayMutation.mutate({
        date: selectedDate.toISOString(),
        reason: reason.trim(),
        isRecurringYearly,
      });
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      cutoffHour,
      cutoffMinute,
      processingDays,
    });
  };

  const isNonDeliveryDay = (date: Date) => {
    return nonDeliveryDays.some((day) => {
      const dayDate = new Date(day.date);
      if (day.isRecurringYearly) {
        return (
          dayDate.getMonth() === date.getMonth() &&
          dayDate.getDate() === date.getDate()
        );
      }
      return isSameDay(dayDate, date);
    });
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getStartingDayOffset = () => {
    const start = startOfMonth(currentMonth);
    return start.getDay();
  };

  const weekDays = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

  if (isLoadingDays || isLoadingSettings) {
    return (
      <div className="container mx-auto p-6">
        <AdminHeader title="Хүргэлтийн тохиргоо" />
        <div className="flex justify-center p-8">
          <p>Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminHeader title="Хүргэлтийн тохиргоо" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Захиалгын хаалтын цаг
            </CardTitle>
            <CardDescription>
              Энэ цагаас өмнө захиалга өгсөн бол маргааш хүргэгдэнэ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="cutoffHour">Цаг</Label>
                <Input
                  id="cutoffHour"
                  type="number"
                  min="0"
                  max="23"
                  value={cutoffHour}
                  onChange={(e) => setCutoffHour(parseInt(e.target.value) || 0)}
                  data-testid="input-cutoff-hour"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="cutoffMinute">Минут</Label>
                <Input
                  id="cutoffMinute"
                  type="number"
                  min="0"
                  max="59"
                  value={cutoffMinute}
                  onChange={(e) =>
                    setCutoffMinute(parseInt(e.target.value) || 0)
                  }
                  data-testid="input-cutoff-minute"
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              Одоогийн тохиргоо: {cutoffHour}:
              {cutoffMinute.toString().padStart(2, "0")} өмнө захиалга → Маргааш
              хүргэгдэнэ
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Хүргэлтийн хугацаа
            </CardTitle>
            <CardDescription>
              Захиалга өгсөнөөс хойш хүргэх хоног
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="processingDays">Боловсруулах хоног</Label>
              <Input
                id="processingDays"
                type="number"
                min="1"
                max="7"
                value={processingDays}
                onChange={(e) =>
                  setProcessingDays(parseInt(e.target.value) || 1)
                }
                data-testid="input-processing-days"
              />
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              Одоогийн тохиргоо: Захиалгаас {processingDays} хоногийн дараа
              хүргэгдэнэ
            </div>
            <Button
              onClick={handleSaveSettings}
              className="w-full"
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              Тохиргоо хадгалах
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Хүргэлтгүй өдрийн хуанли
          </CardTitle>
          <CardDescription>
            Улаан өнгөөр тэмдэглэсэн өдрүүдэд хүргэлт хийгдэхгүй. Өдөр дээр дарж
            хүргэлтгүй өдөр нэмнэ үү.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, "yyyy оны M сар", { locale: mn })}
            </h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getStartingDayOffset() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {getDaysInMonth().map((date) => {
              const isNonDelivery = isNonDeliveryDay(date);
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                    isNonDelivery
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : isToday
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "hover:bg-gray-100"
                  }`}
                  data-testid={`calendar-day-${format(date, "yyyy-MM-dd")}`}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Хүргэлтгүй өдрийн жагсаалт</CardTitle>
            <CardDescription>Бүх хүргэлтгүй өдрийн жагсаалт</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {nonDeliveryDays.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Хүргэлтгүй өдөр тохируулаагүй байна. Хуанлиас өдөр сонгож нэмнэ
              үү.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Шалтгаан</TableHead>
                  <TableHead>Жил бүр давтагдах</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonDeliveryDays.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell>
                      {format(new Date(day.date), "yyyy оны M сарын d (EEE)", {
                        locale: mn,
                      })}
                    </TableCell>
                    <TableCell>{day.reason}</TableCell>
                    <TableCell>
                      {day.isRecurringYearly ? (
                        <span className="text-green-600">Тийм</span>
                      ) : (
                        <span className="text-gray-400">Үгүй</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDayToDelete(day)}
                        data-testid={`button-delete-day-${day.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Хүргэлтгүй өдөр нэмэх</DialogTitle>
            <DialogDescription>
              {selectedDate &&
                format(selectedDate, "yyyy оны M сарын d", { locale: mn })}
              -г хүргэлтгүй өдөр болгон тохируулна
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Шалтгаан</Label>
              <Input
                id="reason"
                placeholder="Жишээ нь: Баяр, Цагаан сар, Наадам гэх мэт"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="input-reason"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurringYearly}
                onCheckedChange={(checked) =>
                  setIsRecurringYearly(checked === true)
                }
                data-testid="checkbox-recurring"
              />
              <Label htmlFor="recurring" className="text-sm">
                Жил бүр давтагдах (Жишээ нь: Цагаан сар, Наадам)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Болих
            </Button>
            <Button
              onClick={handleAddNonDeliveryDay}
              disabled={
                !reason.trim() || createNonDeliveryDayMutation.isPending
              }
              data-testid="button-confirm-add"
            >
              Нэмэх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!dayToDelete}
        onOpenChange={() => setDayToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Хүргэлтгүй өдөр устгах</AlertDialogTitle>
            <AlertDialogDescription>
              {dayToDelete && (
                <>
                  {format(new Date(dayToDelete.date), "yyyy оны M сарын d", {
                    locale: mn,
                  })}{" "}
                  ({dayToDelete.reason})-г устгах уу?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                dayToDelete &&
                deleteNonDeliveryDayMutation.mutate(dayToDelete.id)
              }
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
