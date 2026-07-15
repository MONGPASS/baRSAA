import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";
import { Loader2, Search, User as UserIcon } from "lucide-react";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <AdminHeader
          title="Хэрэглэгчид"
          description="Бүртгэлтэй хэрэглэгчдийн жагсаалт"
          icon={<UserIcon className="h-6 w-6" />}
        />

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Бүх хэрэглэгчид</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Хайх..."
                  className="w-full pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                        Хэрэглэгчийн нэр
                      </th>
                      <th className="px-4 py-3 text-sm font-medium">
                        Бүтэн нэр
                      </th>
                      <th className="px-4 py-3 text-sm font-medium">Имэйл</th>
                      <th className="px-4 py-3 text-sm font-medium">Утас</th>
                      <th className="px-4 py-3 text-sm font-medium">
                        Админ эрх
                      </th>
                      <th className="px-4 py-3 text-sm font-medium">
                        Бүртгүүлсэн огноо
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-muted-foreground"
                        >
                          Хэрэглэгч олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        // Helper function to mask sensitive data
                        const maskData = (
                          str: string | null | undefined,
                          type: "email" | "phone",
                        ) => {
                          if (!str) return "-";
                          if (type === "email") {
                            const parts = str.split("@");
                            if (parts.length !== 2) return str;
                            const name = parts[0];
                            if (name.length <= 3) return str; // Don't mask very short emails
                            return `${name.substring(0, 3)}***@${parts[1]}`;
                          } else {
                            // Phone masking (keep first 2 and last 2 digits if possible)
                            if (str.length < 5) return str;
                            return `${str.substring(0, 2)}****${str.substring(str.length - 2)}`;
                          }
                        };

                        return (
                          <tr
                            key={user.id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="px-4 py-3 text-sm">{user.id}</td>
                            <td className="px-4 py-3 text-sm">
                              {user.username}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.email && user.email.trim() !== "" ? (
                                <span title={user.email}>
                                  {maskData(user.email, "email")}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  И-мэйл байхгүй
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.phone ? (
                                <span title={user.phone}>
                                  {maskData(user.phone, "phone")}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.isAdmin ? (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Тийм
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                  Үгүй
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString(
                                    "mn-MN",
                                  )
                                : "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
