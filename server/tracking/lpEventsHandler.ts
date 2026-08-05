import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLpEventsInsert } from "../../api/lib/lpEventsHandler";

export const handleLpEventsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  payload: Record<string, unknown>
): Promise<boolean> => {
  const result = await handleLpEventsInsert(payload);
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(result.body));
  return true;
};
