interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body: unknown;
  socket?: { remoteAddress?: string | null };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

const setCors = (res: ApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
};

const sendError = (res: ApiResponse, status: number, error: string) => {
  try {
    setCors(res);
    res.status(status).json({ error });
  } catch {
    // Response may already be closed.
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    setCors(res);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body =
      typeof req.body === "object" && req.body !== null
        ? (req.body as Record<string, unknown>)
        : {};

    const { handleLandingsInsert } = await import(
      "../server/tracking/landingsHandler"
    );

    const result = await handleLandingsInsert(req, body);
    res.status(result.status).json(result.body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to insert landing";
    sendError(res, 500, message);
  }
}
