export const invokeEdgeFunction = async <T>(
  functionName: string,
  body: unknown
): Promise<T> => {
  const response = await fetch(`/api/edge/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.trim()) message = payload.error.trim();
    } catch {
      // use generic message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const assertEdgeFunctionsAvailable = (): void => {};
