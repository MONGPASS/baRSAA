import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Opt-in dev-only mock API. Enabled only with `vite --mode mock`
// (i.e. `npm run dev:mock`). It serves /api/* from the static JSON files in
// client/public/data — the SAME files Vercel serves via vercel.json rewrites,
// so the local preview and the deployed demo show identical data.
function mockApiPlugin() {
  const dataDir = path.resolve(import.meta.dirname, "client", "public", "data");
  const routeToFile: Record<string, string> = {
    "/api/products": "products.json",
    "/api/categories": "categories.json",
    "/api/reviews": "reviews.json",
    "/api/delivery-settings": "delivery-settings.json",
    "/api/non-delivery-days": "non-delivery-days.json",
    "/api/navigation": "navigation.json",
    "/api/settings/hero": "hero.json",
    "/api/settings/footer": "footer.json",
    "/api/settings/site-name": "site-name.json",
    "/api/settings/shipping-fee": "shipping-fee.json",
    "/api/bank-accounts": "bank-accounts.json",
    "/api/bank-accounts/default": "bank-account-default.json",
    "/api/user": "user.json",
  };
  return {
    name: "mock-api",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = (req.url || "").split("?")[0];
        if (!url.startsWith("/api/")) return next();
        res.setHeader("Content-Type", "application/json");
        const file = routeToFile[url];
        if (file) {
          try {
            res.end(fs.readFileSync(path.join(dataDir, file), "utf-8"));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }
        // Unknown API route → empty list (matches Vercel SPA-fallback tolerance)
        res.end(JSON.stringify([]));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const useMock = mode === "mock";
  return {
    plugins: [react(), ...(useMock ? [mockApiPlugin()] : [])],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    envDir: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-motion": ["framer-motion"],
            "vendor-icons": ["react-icons", "lucide-react"],
            "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-toast"],
          },
        },
      },
    },
    server: {
      // In mock mode the plugin above answers /api itself, so skip the proxy.
      proxy: useMock
        ? undefined
        : {
            "/api": { target: "http://127.0.0.1:8788", changeOrigin: true },
            "/uploads": { target: "http://127.0.0.1:8788", changeOrigin: true },
          },
    },
  };
});
