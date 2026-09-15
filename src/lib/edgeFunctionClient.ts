// Always use the proxy path (/api/edge/*) — Supabase direct access has been removed.
export {
  assertEdgeFunctionsAvailable,
  invokeEdgeFunction,
} from "./edgeFunctionClient.proxy";
