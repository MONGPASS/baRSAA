import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";
import { logMobileCookieDebug } from "@/utils/cookieUtils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Login form schema
const loginFormSchema = z.object({
  email: z.string().min(1, {
    message: "И-мэйл эсвэл хэрэглэгчийн нэр оруулна уу", // Allow username
  }),
  password: z.string().min(1, {
    message: "Нууц үг оруулна уу",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if redirected from admin panel
  const isRedirected = location.includes("?redirect=true");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    // CHECK FOR LOCAL ADMIN BYPASS (DEV ONLY)
    if (
      import.meta.env.DEV &&
      data.email === "admin" &&
      data.password === "admin123"
    ) {
      localStorage.setItem("mock_admin_session", "true");

      // Initializing query data for immediate feedback if queryClient is used elsewhere
      // (Though admin panel likely refetches /api/user or checks auth)

      toast({
        title: "Амжилттай нэвтэрлээ (Local Admin)",
        description: "Админ хэсэгт тавтай морил.",
      });

      setTimeout(() => {
        setLocation("/admin");
      }, 500);
      return;
    }

    try {
      // API Login
      const user = await apiRequest("POST", "/api/admin/login", {
        username: data.email, // Use email as username for now or update API to accept email
        password: data.password,
      });

      // apiRequest handles response parsing, so 'user' is already the data

      // 네이티브 앱: 응답의 토큰을 저장 (이후 요청에 Authorization 헤더로 첨부됨)
      setAuthToken(user?.token);

      // Add to React Query cache so the AdminRoute wrapper knows we are authenticated
      queryClient.setQueryData(["/api/user"], user);

      toast({
        title: "Амжилттай нэвтэрлээ",
        description: "Админ хэсэгт тавтай морил.",
      });

      // Debug cookies on mobile after login
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      if (isMobile) {
        console.log("=== POST-LOGIN MOBILE COOKIE DEBUG ===");
        logMobileCookieDebug();
      }

      // Wait for session to be properly set
      setTimeout(() => {
        setLocation("/admin");
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Нэвтрэх үед алдаа гарлаа",
        description: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <span className="material-icons text-3xl mr-2 text-[#E8442E]">
                admin_panel_settings
              </span>
              <CardTitle className="text-2xl font-bold text-[#E8442E]">
                Админ нэвтрэх
              </CardTitle>
            </div>
            {isRedirected && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
                Үйлдэл хийхийн тулд эхлээд нэвтэрнэ үү.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>И-мэйл</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нууц үг</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#E8442E] hover:brightness-105 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Нэвтэрч байна...
                    </>
                  ) : (
                    "Нэвтрэх"
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500 mt-4">
                  <Button
                    variant="link"
                    onClick={() => setLocation("/")}
                    className="text-[#E8442E] font-medium"
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
