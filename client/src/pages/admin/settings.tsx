import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/header";
import { AdminLayout } from "@/components/admin/layout";
import { HelpTooltip } from "@/components/admin/help-tooltip";
import { helpIllustrations } from "@/assets/help/index";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define our validation schema
const shippingRulesSchema = z.object({
  fee: z.coerce.number().min(0, { message: "0-с их байх ёстой" }),
});

type ShippingRulesFormValues = z.infer<typeof shippingRulesSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the current shipping rules
  const { data: shippingRulesData, isLoading } = useQuery({
    queryKey: ["/api/settings/shipping-fee"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/shipping-fee");
      try {
        if (response && response.value) {
          return JSON.parse(response.value) as {
            min: number;
            max: number;
            fee: number;
          }[];
        }
      } catch (e) {
        console.error("Failed to parse shipping rules", e);
      }
      return [];
    },
  });

  // Set up the form with react-hook-form
  const form = useForm<ShippingRulesFormValues>({
    resolver: zodResolver(shippingRulesSchema),
    defaultValues: {
      fee: 0,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (shippingRulesData && shippingRulesData.length > 0) {
      form.reset({ fee: shippingRulesData[0].fee });
    } else if (shippingRulesData && shippingRulesData.length === 0) {
      form.reset({ fee: 6000 }); // Default
    }
  }, [shippingRulesData, form]);

  // Update shipping rules mutation
  const { mutate: updateShippingRules, isPending } = useMutation({
    mutationFn: async (data: ShippingRulesFormValues) => {
      // Keep backend schema structure the same by wrapping in array for 'shipping_rules' setting
      const rules = [{ min: 0, max: 999999, fee: data.fee }];
      return apiRequest("PUT", "/api/settings/shipping-fee", {
        value: JSON.stringify(rules),
      });
    },
    onSuccess: () => {
      toast({
        title: "Хүргэлтийн дүрэм шинэчлэгдлээ",
        description: "Шинэ хүргэлтийн жингийн интервалууд хадгалагдлаа.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/settings/shipping-fee"],
      });
    },
    onError: () => {
      toast({
        title: "Хүргэлтийн дүрмийг шинэчлэхэд алдаа гарлаа",
        description: "Дахин оролдоно уу.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ShippingRulesFormValues) {
    updateShippingRules(data);
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <AdminHeader title="Системийн тохиргоо" />
          <HelpTooltip
            content={
              <div className="space-y-4">
                <p>
                  Энэ хэсэгт та веб дэлгүүрийн ерөнхий тохиргоог хийх боломжтой.
                </p>
                <p>
                  <strong>Хүргэлтийн төлбөр:</strong> Энэ тохиргоо нь захиалга
                  хийх үед нийт жингээс хамаарч бодогдох хүргэлтийн төлбөрийг
                  тохируулна.
                </p>
              </div>
            }
            illustration={helpIllustrations.categoryManagement}
          />
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              Хүргэлтийн төлбөрийн тохиргоо
            </CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              Бүх захиалгад автоматаар нэмэгдэх хүргэлтийн тогтмол төлбөрийг тохируулна.
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Төлбөр (₩)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="10" className="max-w-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Хадгалж байна...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Хадгалах
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
