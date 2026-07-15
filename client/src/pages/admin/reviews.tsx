import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Review } from "@shared/schema";
import {
  Loader2,
  Search,
  Star,
  Check,
  X,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/admin/reviews");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      isApproved,
    }: {
      id: number;
      isApproved: boolean;
    }) => {
      await apiRequest("PATCH", `/api/admin/reviews/${id}`, { isApproved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast({
        title: "Амжилттай",
        description: "Сэтгэгдэл шинэчлэгдлээ",
      });
    },
    onError: () => {
      toast({
        title: "Алдаа",
        description: "Сэтгэгдэл шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast({
        title: "Амжилттай",
        description: "Сэтгэгдэл устгагдлаа",
      });
      setDeleteReviewId(null);
    },
    onError: () => {
      toast({
        title: "Алдаа",
        description: "Сэтгэгдэл устгахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const filteredReviews = reviews.filter(
    (review) =>
      review.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <AdminHeader
          title="Сэтгэгдлүүд"
          description="Хэрэглэгчдийн сэтгэгдлийг удирдах"
          icon={<MessageSquare className="h-6 w-6" />}
        />

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Бүх сэтгэгдлүүд</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Хайх..."
                  className="w-full pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-reviews"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="px-4 py-3 text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-sm font-medium">
                        Хэрэглэгч
                      </th>
                      <th className="px-4 py-3 text-sm font-medium">Үнэлгээ</th>
                      <th className="px-4 py-3 text-sm font-medium">
                        Сэтгэгдэл
                      </th>
                      <th className="px-4 py-3 text-sm font-medium">Төлөв</th>
                      <th className="px-4 py-3 text-sm font-medium">Огноо</th>
                      <th className="px-4 py-3 text-sm font-medium">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-muted-foreground"
                        >
                          Сэтгэгдэл олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map((review) => (
                        <tr
                          key={review.id}
                          className="border-b hover:bg-muted/50"
                          data-testid={`row-review-${review.id}`}
                        >
                          <td className="px-4 py-3 text-sm">{review.id}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {review.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {renderStars(review.rating)}
                          </td>
                          <td
                            className="px-4 py-3 text-sm max-w-xs truncate"
                            title={review.content}
                          >
                            {review.content}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {review.isApproved ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Зөвшөөрөгдсөн
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Хүлээгдэж буй
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString(
                                  "mn-MN",
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {!review.isApproved ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    approveMutation.mutate({
                                      id: review.id,
                                      isApproved: true,
                                    })
                                  }
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-approve-${review.id}`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                  onClick={() =>
                                    approveMutation.mutate({
                                      id: review.id,
                                      isApproved: false,
                                    })
                                  }
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-unapprove-${review.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteReviewId(review.id)}
                                data-testid={`button-delete-${review.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => !open && setDeleteReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сэтгэгдэл устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та энэ сэтгэгдлийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг
              буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Цуцлах
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteReviewId && deleteMutation.mutate(deleteReviewId)
              }
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Устгах"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
