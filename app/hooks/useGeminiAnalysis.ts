import { useCallback, useState } from "react";

interface GeminiAnalysisOptions {
  stockName?: string;
  analysisType?: "sentiment" | "trend" | "recommendation" | "summary";
}

interface GeminiResponse {
  content: string;
  error?: string;
  isLoading: boolean;
}

export const useGeminiAnalysis = () => {
  const [response, setResponse] = useState<GeminiResponse>({
    content: "",
    error: undefined,
    isLoading: false,
  });

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";
  const apiBase = "https://generativelanguage.googleapis.com/v1beta";

  const analyzeStock = useCallback(
    async (prompt: string, options?: GeminiAnalysisOptions) => {
      if (!apiKey) {
        setResponse({
          content: "",
          error: "Gemini API key not configured",
          isLoading: false,
        });
        return;
      }

      setResponse({ content: "", isLoading: true });

      try {
        const fullPrompt = options?.stockName
          ? `Analyze ${options.stockName}: ${prompt}`
          : prompt;

        const response = await fetch(
          `${apiBase}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: fullPrompt,
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
          const content = data.candidates[0].content.parts[0].text;
          setResponse({
            content,
            error: undefined,
            isLoading: false,
          });
        } else {
          throw new Error("No content in response");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setResponse({
          content: "",
          error: errorMessage,
          isLoading: false,
        });
      }
    },
    [apiKey, model],
  );

  // Predefined analysis functions
  const analyzeSentiment = useCallback(
    (stockName: string, priceData: string) => {
      const prompt = `Based on the following stock data, provide a sentiment analysis (bullish/bearish/neutral) with brief reasoning:\n${priceData}`;
      return analyzeStock(prompt, { stockName, analysisType: "sentiment" });
    },
    [analyzeStock],
  );

  const analyzeTrend = useCallback(
    (stockName: string, priceHistory: string) => {
      const prompt = `Analyze the trend for this stock based on the following price history:\n${priceHistory}\nProvide a brief technical analysis.`;
      return analyzeStock(prompt, { stockName, analysisType: "trend" });
    },
    [analyzeStock],
  );

  const getRecommendation = useCallback(
    (stockName: string, fundamentals: string) => {
      const prompt = `Based on the following fundamentals for ${stockName}, provide a buy/hold/sell recommendation with reasoning:\n${fundamentals}`;
      return analyzeStock(prompt, {
        stockName,
        analysisType: "recommendation",
      });
    },
    [analyzeStock],
  );

  const getSummary = useCallback(
    (newsText: string) => {
      const prompt = `Summarize the following stock market news in 2-3 sentences:\n${newsText}`;
      return analyzeStock(prompt, { analysisType: "summary" });
    },
    [analyzeStock],
  );

  return {
    response,
    analyzeStock,
    analyzeSentiment,
    analyzeTrend,
    getRecommendation,
    getSummary,
  };
};
