import { parseEdgeFunctionInvokeError } from "@/lib/hotelSearchErrors";
import { hasSupabaseClientConfig } from "@/lib/apiAvailability";
import { supabase } from "@/lib/supabaseClient";

export const invokeEdgeFunction = async <T>(
  functionName: string,
  body: unknown
): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body });

  if (error) {
    throw new Error(await parseEdgeFunctionInvokeError(error));
  }

  return data as T;
};

export const assertEdgeFunctionsAvailable = (): void => {
  if (!hasSupabaseClientConfig) {
    throw new Error(
      "Supabase client configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
};
