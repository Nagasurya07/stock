import { useCallback, useState } from "react";

interface ProcessedQuery {
  success: boolean;
  originalQuery: string;
  preprocessedQuery?: any;
  validatedQuery?: any;
  metadata?: {
    intent: string;
    confidence: number;
    fieldsUsed: number;
    processingTime: number;
  };
  error?: string;
  invalidFields?: string[];
  suggestions?: Array<{ invalid: string; suggestions: string[] }>;
}

interface QueryState {
  isProcessing: boolean;
  result: ProcessedQuery | null;
  error: string | null;
}

export const useQueryProcessor = () => {
  const [state, setState] = useState<QueryState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const geminiModel =
    process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

  const processQuery = useCallback(
    async (userQuery: string) => {
      if (!geminiApiKey) {
        setState({
          isProcessing: false,
          result: null,
          error: "Gemini API key not configured",
        });
        return null;
      }

      setState({ isProcessing: true, result: null, error: null });

      try {
        // In a real implementation, this would call your backend API
        // For now, we'll simulate the query processing
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/api/query/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: userQuery,
              apiKey: geminiApiKey,
              model: geminiModel,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result: ProcessedQuery = await response.json();

        setState({
          isProcessing: false,
          result,
          error: null,
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState({
          isProcessing: false,
          result: null,
          error: errorMessage,
        });

        return null;
      }
    },
    [geminiApiKey, geminiModel],
  );

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    isProcessing: state.isProcessing,
    result: state.result,
    error: state.error,
    processQuery,
    reset,
  };
};
