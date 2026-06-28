import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { writeFileSync } from "fs";
import { componentTagger } from "lovable-tagger";

const htmlEnvPlugin = (env: Record<string, string>): Plugin => ({
  name: "html-env-transform",
  transformIndexHtml(html) {
    const values = {
      VITE_SITE_NAME: env.VITE_SITE_NAME || "Hotel Search",
      VITE_SITE_OPERATOR: env.VITE_SITE_OPERATOR || "",
      VITE_SITE_DOMAIN: env.VITE_SITE_DOMAIN || "localhost",
    };

    return Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replaceAll(`__${key}__`, value),
      html
    );
  },
});

const webManifestPlugin = (env: Record<string, string>): Plugin => {
  const buildManifest = () => ({
    name: env.VITE_SITE_NAME || "Hotel Search",
    short_name: env.VITE_SITE_SHORT_NAME || "HotelSearch",
    description: "Compare hotel and rental prices worldwide.",
    icons: [
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    theme_color: "#2563EB",
    background_color: "#ffffff",
    display: "standalone",
  });

  return {
    name: "generate-webmanifest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] === "/site.webmanifest") {
          res.setHeader("Content-Type", "application/manifest+json");
          res.end(`${JSON.stringify(buildManifest(), null, 2)}\n`);
          return;
        }
        next();
      });
    },
    closeBundle() {
      writeFileSync(
        path.resolve(__dirname, "dist/site.webmanifest"),
        `${JSON.stringify(buildManifest(), null, 2)}\n`
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useApiProxy = env.VITE_USE_API_PROXY === "true";
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      ...(useApiProxy && supabaseUrl
        ? {
            proxy: {
              "/api/edge": {
                target: supabaseUrl,
                changeOrigin: true,
                rewrite: (requestPath) =>
                  requestPath.replace(/^\/api\/edge\//, "/functions/v1/"),
                configure: (proxy) => {
                  proxy.on("proxyReq", (proxyReq) => {
                    if (anonKey) {
                      proxyReq.setHeader("Authorization", `Bearer ${anonKey}`);
                      proxyReq.setHeader("apikey", anonKey);
                    }
                  });
                },
              },
            },
          }
        : {}),
    },
    plugins: [
      react(),
      htmlEnvPlugin(env),
      webManifestPlugin(env),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: [
        ...(useApiProxy
          ? [
              {
                find: "@/lib/edgeFunctionClient",
                replacement: path.resolve(
                  __dirname,
                  "./src/lib/edgeFunctionClient.proxy.ts"
                ),
              },
              {
                find: "@/lib/landingTrackingService",
                replacement: path.resolve(
                  __dirname,
                  "./src/lib/landingTrackingService.proxy.ts"
                ),
              },
              {
                find: "@/lib/partnerClickTracking",
                replacement: path.resolve(
                  __dirname,
                  "./src/lib/partnerClickTracking.proxy.ts"
                ),
              },
            ]
          : []),
        {
          find: "@",
          replacement: path.resolve(__dirname, "./src"),
        },
      ],
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["@radix-ui/react-dialog"],
    },
  };
});
