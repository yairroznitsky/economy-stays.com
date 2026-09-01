import type { Plugin } from "vite";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLocalEdgeRequest } from "./index";
import { handleTrackingRequest } from "../tracking/http";
import { isValidSpiderToken } from "../spider/spiderToken";
import { runSpiderKayakRedirect } from "../spider/runSpiderKayakRedirect";

const matchEdgePath = (url: string | undefined): string | null => {
  if (!url) return null;
  const pathname = url.split("?")[0];
  const match = pathname.match(/^\/api\/edge\/([^/]+)\/?$/);
  return match?.[1] ?? null;
};

const matchSpiderTokenPath = (url: string | undefined): string | null => {
  if (!url) return null;
  const pathname = url.split("?")[0];
  const match = pathname.match(/^\/s\/([^/]+)\/?$/);
  return match?.[1] ?? null;
};

const hydrateProcessEnv = (mode: string, envDir: string) => {
  const loaded = loadEnv(mode, envDir, "");
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

/** Serves POST /api/landings and /api/search in Vite dev (always). */
export const localTrackingPlugin = (): Plugin => ({
  name: "local-tracking-api",
  configureServer(server) {
    hydrateProcessEnv(server.config.mode, server.config.envDir);

    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
        void handleTrackingRequest(req, res)
          .then((handled) => {
            if (!handled) next();
          })
          .catch((error: unknown) => {
            // Keep failures scoped to tracking — never break /api/edge or the SPA.
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              const message =
                error instanceof Error ? error.message : "Tracking handler failed";
              res.end(JSON.stringify({ error: message }));
              return;
            }
            next(error instanceof Error ? error : new Error(String(error)));
          });
      }
    );
  },
});

/** Hidden GET /s/<token> → Kayak hotels deeplink when SPIDER_TOKEN matches. */
export const localSpiderPlugin = (): Plugin => ({
  name: "local-spider-redirect",
  configureServer(server) {
    hydrateProcessEnv(server.config.mode, server.config.envDir);

    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
        if (req.method !== "GET") {
          next();
          return;
        }

        const token = matchSpiderTokenPath(req.url);
        if (!token) {
          next();
          return;
        }

        if (!isValidSpiderToken(token)) {
          next();
          return;
        }

        void runSpiderKayakRedirect()
          .then((result) => {
            if (!result.ok) {
              if (!res.headersSent) {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Cache-Control", "no-store");
                res.setHeader("X-Robots-Tag", "noindex");
                res.end(JSON.stringify({ error: result.error }));
              }
              return;
            }

            if (!res.headersSent) {
              res.statusCode = 302;
              res.setHeader("Location", result.redirectUrl);
              res.setHeader("Cache-Control", "no-store");
              res.setHeader("X-Robots-Tag", "noindex");
              res.end();
            }
          })
          .catch((error: unknown) => {
            if (!res.headersSent) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Cache-Control", "no-store");
              res.setHeader("X-Robots-Tag", "noindex");
              const message =
                error instanceof Error ? error.message : "Spider redirect failed";
              res.end(JSON.stringify({ error: message }));
            } else {
              next(error instanceof Error ? error : new Error(String(error)));
            }
          });
      }
    );
  },
});

/** Serves local hotel-affiliate-router + kayak-autocomplete at /api/edge/*. */
export const localEdgePlugin = (): Plugin => ({
  name: "local-edge-functions",
  configureServer(server) {
    hydrateProcessEnv(server.config.mode, server.config.envDir);

    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
        const functionName = matchEdgePath(req.url);
        if (!functionName) {
          next();
          return;
        }

        void handleLocalEdgeRequest(functionName, req, res)
          .then((handled) => {
            if (!handled) next();
          })
          .catch((error: unknown) => {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              const message =
                error instanceof Error ? error.message : "Edge handler failed";
              res.end(JSON.stringify({ error: message }));
              return;
            }
            next(error instanceof Error ? error : new Error(String(error)));
          });
      }
    );
  },
});
