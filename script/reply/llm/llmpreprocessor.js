/**
 * LLM Preprocessor
 * Uses Gemini AI to convert natural language queries to structured database queries
 */

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  "AIzaSyC5ppCM0i7f2LWIN_4Ne2RnDNuE5k8lkKg";
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Groq API (Fallback LLM)
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || "mixtral-8x7b-32768";
const GROQ_API_BASE = "https://api.groq.com/openai/v1";
/**
 * Preprocess query using Groq API (fallback when Gemini rate-limited)
 * @param {string} userQuery - User's natural language query
 * @returns {Promise<Object>} Structured query or error
 */
async function preprocessQueryWithGroq(userQuery) {
  if (!GROQ_API_KEY) {
    return {
      error: "Groq API key not configured",
      structuredQuery: null,
    };
  }

  console.log("⚡ Preprocessing query with Groq (Gemini fallback)...");
  console.log("Input:", userQuery);

  try {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `User Query: "${userQuery}"\n\nReturn structured JSON:`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("⚠️ Groq API Error:", errorData);
      return {
        error: `Groq API error: ${response.status}`,
        structuredQuery: null,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return {
        error: "No response from Groq",
        structuredQuery: null,
      };
    }

    const content = data.choices[0].message.content;
    console.log("Raw Groq Response:", content);

    // Extract JSON from response
    let jsonText = content.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const structuredQuery = JSON.parse(jsonText);
    console.log(
      "✅ Groq Structured Query:",
      JSON.stringify(structuredQuery, null, 2),
    );

    return {
      success: true,
      structuredQuery: structuredQuery,
      source: "groq",
    };
  } catch (error) {
    console.error("❌ Groq preprocessing failed:", error.message);
    return {
      error: error.message,
      structuredQuery: null,
    };
  }
}

// Valid database fields reference
const VALID_FIELDS = [
  // Fundamentals
  "pe_ratio",
  "peg_ratio",
  "pb_ratio",
  "ps_ratio",
  "dividend_yield",
  "beta",
  "eps",
  "book_value_per_share",
  "profit_margin",
  "operating_margin",
  "return_on_equity",
  "return_on_assets",
  "current_ratio",
  "quick_ratio",
  "interest_coverage",
  "debt_to_equity_ratio",
  "total_debt",
  "free_cash_flow",
  "debt_to_fcf_ratio",
  // Shareholding
  "promoter_holding_percentage",
  "institutional_holding_percentage",
  "public_holding_percentage",
  "foreign_institutional_holding",
  "domestic_institutional_holding",
  "mutual_fund_holding",
  "retail_holding",
  "promoter_pledge_percentage",
  // Stocks
  "market_cap",
  "employees",
  "average_volume",
  "shares_outstanding",
  "insider_ownership_percentage",
  "institutional_ownership_percentage",
  // Financials
  "revenue",
  "ebitda",
  "revenue_yoy_growth",
  "ebitda_yoy_growth",
  "gross_profit",
  "operating_income",
  "net_income",
  "gross_margin",
  "net_margin",
  "eps_basic",
  "eps_diluted",
  // Earnings
  "earnings_date",
  "estimated_eps",
  "expected_revenue",
  "beat_probability",
  "analyst_target_price_low",
  "analyst_target_price_high",
  "current_price",
  "analyst_count",
  "consensus_rating",
];

const SYSTEM_PROMPT = `You are a stock market query preprocessor. Convert natural language queries into structured database queries.

**Available Database Fields:**
${VALID_FIELDS.join(", ")}

**Your Task:**
1. Extract the user's intent (filter, search, analyze, compare)
2. Identify relevant database fields
3. Extract comparison operators (>, <, >=, <=, =, BETWEEN)
4. Extract values or ranges
5. Return structured JSON

**Output Format:**
{
  "intent": "filter|search|analyze|compare",
  "fields": ["field_name"],
  "conditions": [
    {
      "field": "field_name",
      "operator": ">|<|>=|<=|=|BETWEEN",
      "value": number or [min, max],
      "unit": "%" or "B" or "M" etc
    }
  ],
  "orderBy": "field_name",
  "limit": number,
  "confidence": 0.0-1.0
}

**Examples:**

User: "Show me stocks with PE ratio less than 15"
Response: {
  "intent": "filter",
  "fields": ["pe_ratio"],
  "conditions": [{"field": "pe_ratio", "operator": "<", "value": 15}],
  "confidence": 0.95
}

User: "Find high dividend paying companies"
Response: {
  "intent": "filter",
  "fields": ["dividend_yield"],
  "conditions": [{"field": "dividend_yield", "operator": ">", "value": 3, "unit": "%"}],
  "orderBy": "dividend_yield",
  "confidence": 0.85
}

User: "Stocks with market cap over 1000 crores and good profit margins"
Response: {
  "intent": "filter",
  "fields": ["market_cap", "profit_margin"],
  "conditions": [
    {"field": "market_cap", "operator": ">", "value": 1000, "unit": "Cr"},
    {"field": "profit_margin", "operator": ">", "value": 15, "unit": "%"}
  ],
  "confidence": 0.90
}

User: "Compare TCS and Infosys revenue growth"
Response: {
  "intent": "compare",
  "fields": ["revenue_yoy_growth"],
  "conditions": [{"field": "company", "operator": "IN", "value": ["TCS", "Infosys"]}],
  "confidence": 0.92
}

Return ONLY valid JSON. No markdown, no explanation.`;

/**
 * Preprocess user query with Gemini AI
 * @param {string} userQuery - Natural language query from user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Preprocessed structured query
 */
export async function preprocessQuery(userQuery, options = {}) {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ Gemini API key missing. Using Groq fallback...");
    return preprocessQueryWithGroq(userQuery);
  }

  console.log("🤖 Preprocessing query with Gemini...");
  console.log("Input:", userQuery);

  try {
    const response = await fetch(
      `${API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser Query: "${userQuery}"\n\nReturn structured JSON:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    // Check if rate-limited (429) or quota exceeded
    if (response.status === 429) {
      console.warn("⚠️ Gemini rate-limited! Trying Groq as fallback...");
      return preprocessQueryWithGroq(userQuery);
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return {
        error: `Gemini API error: ${response.status}`,
        structuredQuery: null,
      };
    }
    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      return {
        error: "No response from Gemini",
        structuredQuery: null,
      };
    }

    const content = data.candidates[0].content.parts[0].text;
    console.log("Raw Gemini Response:", content);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const structuredQuery = JSON.parse(jsonText);

    console.log(
      "✅ Structured Query:",
      JSON.stringify(structuredQuery, null, 2),
    );

    return {
      error: null,
      structuredQuery: structuredQuery,
      intent: structuredQuery.intent,
      confidence: structuredQuery.confidence || 0.8,
      rawResponse: content,
    };
  } catch (error) {
    console.error("❌ Preprocessing Error:", error.message);
    console.warn("⚠️ Gemini failed! Attempting Groq fallback...");
    return preprocessQueryWithGroq(userQuery);
  }
}

/**
 * Validate and clean LLM output
 * @param {Object} structuredQuery - Output from LLM
 * @returns {Object} Validated and cleaned query
 */
export function cleanStructuredQuery(structuredQuery) {
  if (!structuredQuery) {
    return { isValid: false, error: "No structured query provided" };
  }

  // Validate required fields
  if (!structuredQuery.intent || !structuredQuery.fields) {
    return {
      isValid: false,
      error: "Missing required fields: intent and fields",
    };
  }

  // Validate field names
  const invalidFields = structuredQuery.fields.filter(
    (field) => !VALID_FIELDS.includes(field),
  );

  if (invalidFields.length > 0) {
    return {
      isValid: false,
      error: "Invalid database fields",
      invalidFields: invalidFields,
    };
  }

  // Clean and return
  return {
    isValid: true,
    cleanedQuery: {
      intent: structuredQuery.intent,
      fields: structuredQuery.fields,
      conditions: structuredQuery.conditions || [],
      orderBy: structuredQuery.orderBy,
      limit: structuredQuery.limit || 50,
      confidence: structuredQuery.confidence || 0.8,
    },
  };
}

/**
 * Get field suggestions for typos or similar fields
 * @param {string} fieldName - Field name to match
 * @returns {string[]} Suggestions
 */
export function suggestFields(fieldName) {
  const normalized = fieldName.toLowerCase().replace(/[_\s-]/g, "");

  return VALID_FIELDS.filter((validField) => {
    const validNormalized = validField.toLowerCase().replace(/[_\s-]/g, "");
    return (
      validNormalized.includes(normalized) ||
      normalized.includes(validNormalized) ||
      levenshteinDistance(normalized, validNormalized) <= 3
    );
  }).slice(0, 5);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
