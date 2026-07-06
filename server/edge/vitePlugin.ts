import type { Plugin } from "vite";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLocalEdgeRequest } from "./index";

const matchEdgePath = (url: string | undefined): string | null => {
  if (!url) return null;
  const pathname = url.split("?")[0];
  const match = pathname.match(/^\/api\/edge\/([^/]+)\/?$/);
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

        void handleLocalEdgeRequest(functionName, req, res).then((handled) => {
          if (!handled) next();
        });
      }
    );
  },
});
