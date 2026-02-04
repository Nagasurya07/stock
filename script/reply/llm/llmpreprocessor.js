/**
 * LLM Preprocessor
 * Uses Gemini AI to convert natural language queries to structured database queries
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Groq API (Fallback LLM)
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || "mixtral-8x7b-32768";
const GROQ_API_BASE = "https://api.groq.com/openai/v1";
// AI Configuration: Use AI in 90% of scenarios, fallback in 10%
const USE_AI_PERCENTAGE = 0.9;
const AI_CONFIDENCE_THRESHOLD = 0.75;

// Query cache to avoid duplicate AI calls
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Request deduplication
const pendingRequests = new Map(); /**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
  // Limit cache size
  if (queryCache.size > MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    queryCache.delete(oldestKey);
  }
}

/**
 * Get cached query or return null
 */
function getCachedQuery(query) {
  const normalized = query.toLowerCase().trim();
  const cached = queryCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  return null;
}

/**
 * Cache query result
 */
function cacheQuery(query, result) {
  const normalized = query.toLowerCase().trim();
  queryCache.set(normalized, {
    result,
    timestamp: Date.now(),
  });
  cleanCache();
}

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
      error: null,
      structuredQuery: structuredQuery,
      intent: structuredQuery.intent,
      confidence: structuredQuery.confidence || 0.8,
      rawResponse: content,
      usedAI: true,
      mode: "groq",
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

**IMPORTANT RULES:**
- For company name or symbol searches (e.g., "Infosys", "TCS", "INFY"), use "search_term" field with intent "search"
- For filtering by metrics (e.g., "PE ratio < 15"), use the actual metric field names
- Only use fields from the list above
- Do NOT create fields like "company", "name", "symbol" - use "search_term" instead

**Your Task:**
1. Extract the user's intent (filter, search, analyze, compare)
2. If query is a company name/symbol → use "search_term" field
3. If query has metrics/conditions → use relevant database fields
4. Extract comparison operators (>, <, >=, <=, =, BETWEEN)
5. Extract values or ranges
6. **CRITICAL: Extract limit from queries like "top 10", "top ten", "5 stocks", "twenty stocks"**
   - "top ten" → limit: 10
   - "top 5" → limit: 5
   - "twenty stocks" → limit: 20
7. Return structured JSON

**Output Format:**
{
  "intent": "filter|search|analyze|compare",
  "fields": ["field_name"],
  "search_term": "company name or symbol (only for search intent)",
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

User: "top ten stocks"
Response: {
  "intent": "filter",
  "fields": [],
  "conditions": [],
  "limit": 10,
  "confidence": 0.95
}

User: "Infosys"
Response: {
  "intent": "search",
  "search_term": "Infosys",
  "fields": [],
  "conditions": [],
  "confidence": 0.95
}

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
  // Check cache first
  const cached = getCachedQuery(userQuery);
  if (cached && !options.skipCache) {
    console.log("⚡ Using cached result");
    return cached;
  }

  // Request deduplication - if same query is already being processed, wait for it
  const normalized = userQuery.toLowerCase().trim();
  if (pendingRequests.has(normalized)) {
    console.log("⏳ Waiting for pending request...");
    return pendingRequests.get(normalized);
  }

  // Create promise for this request
  const requestPromise = (async () => {
    try {
      // Force AI usage based on configuration (90% of time)
      const shouldUseAI = Math.random() < USE_AI_PERCENTAGE;

      if (!shouldUseAI) {
        const result = createFallbackQuery(userQuery);
        cacheQuery(userQuery, result);
        return result;
      }

      if (!GEMINI_API_KEY) {
        console.warn("⚠️ Gemini API key missing. Using Groq fallback...");
        const result = await preprocessQueryWithGroq(userQuery);
        cacheQuery(userQuery, result);
        return result;
      }

      console.log("🤖 Preprocessing query with AI (90% scenario)...");
      console.log("Input:", userQuery);

      return await processWithGemini(userQuery);
    } finally {
      pendingRequests.delete(normalized);
    }
  })();

  pendingRequests.set(normalized, requestPromise);
  return requestPromise;
}

/**
 * Process query with Gemini (extracted for better organization)
 */
async function processWithGemini(userQuery) {
  try {
    const content = await callGemini(userQuery, 1024);
    let structuredQuery;

    try {
      structuredQuery = safeParseJson(content);
    } catch (parseError) {
      console.warn("⚠️ Gemini returned malformed JSON. Retrying...");
      const retryContent = await callGemini(userQuery, 512);
      structuredQuery = safeParseJson(retryContent);
    }

    console.log(
      "✅ Structured Query:",
      JSON.stringify(structuredQuery, null, 2),
    );

    // Validate confidence level
    const confidence = structuredQuery.confidence || 0.8;
    if (confidence < AI_CONFIDENCE_THRESHOLD) {
      console.warn(
        `⚠️ Low AI confidence (${confidence}), enhancing with fallback logic...`,
      );
      return enhanceWithFallback(structuredQuery, userQuery);
    }

    return {
      error: null,
      structuredQuery: structuredQuery,
      intent: structuredQuery.intent,
      confidence: confidence,
      rawResponse: content,
      usedAI: true,
      mode: "gemini",
    };
  } catch (error) {
    console.error("❌ Preprocessing Error:", error.message);
    console.warn("⚠️ Gemini failed! Attempting Groq fallback...");
    return preprocessQueryWithGroq(userQuery);
  }
}

async function callGemini(userQuery, maxOutputTokens) {
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
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  // Check if rate-limited (429) or quota exceeded
  if (response.status === 429) {
    console.warn("⚠️ Gemini rate-limited! Trying Groq as fallback...");
    const result = await preprocessQueryWithGroq(userQuery);
    cacheQuery(userQuery, result);
    return JSON.stringify(result?.structuredQuery || {});
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]) {
    throw new Error("No response from Gemini");
  }

  const content = data.candidates[0].content.parts[0].text;
  console.log("Raw Gemini Response:", content);
  return content;
}

function safeParseJson(content) {
  if (!content) {
    throw new Error("Empty Gemini response");
  }

  let jsonText = content.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "");
  }

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  jsonText = jsonText.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

  return JSON.parse(jsonText);
}

/**
 * Create a simple fallback query for 10% scenarios
 * @param {string} userQuery - Natural language query
 * @returns {Object} Basic structured query
 */
function createFallbackQuery(userQuery) {
  const lowerQuery = userQuery.toLowerCase();
  const query = {
    intent: "filter",
    fields: [],
    conditions: [],
    confidence: 0.6,
    usedAI: false,
    mode: "fallback",
  };

  // Extract limit from query
  const wordNumberMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
  };
  const limitMatch = lowerQuery.match(
    /\btop\s+(\d+|[a-z]+)\b|\b(\d+|[a-z]+)\s+stocks?\b/,
  );
  if (limitMatch) {
    const rawValue = limitMatch[1] || limitMatch[2];
    const limit = /\d+/.test(rawValue)
      ? parseInt(rawValue, 10)
      : wordNumberMap[rawValue];
    if (limit) query.limit = limit;
  }

  // Simple keyword-based parsing
  if (lowerQuery.includes("pe") && !lowerQuery.includes("peg")) {
    query.fields.push("pe_ratio");
    const match = userQuery.match(/(less than|below|<)\s*(\d+)/i);
    if (match) {
      query.conditions.push({
        field: "pe_ratio",
        operator: "<",
        value: parseFloat(match[2]),
      });
    }
  }

  if (lowerQuery.includes("dividend")) {
    query.fields.push("dividend_yield");
    const match = userQuery.match(/(above|greater|>)\s*(\d+)/i);
    if (match) {
      query.conditions.push({
        field: "dividend_yield",
        operator: ">",
        value: parseFloat(match[2]),
      });
    }
  }

  if (lowerQuery.includes("market cap") || lowerQuery.includes("mcap")) {
    query.fields.push("market_cap");
  }

  return {
    error: null,
    structuredQuery: query,
    intent: query.intent,
    confidence: query.confidence,
    usedAI: false,
    mode: "fallback",
  };
}

/**
 * Enhance low-confidence AI results with fallback logic
 * @param {Object} aiQuery - AI-generated query
 * @param {string} userQuery - Original user query
 * @returns {Object} Enhanced query
 */
function enhanceWithFallback(aiQuery, userQuery) {
  const fallback = createFallbackQuery(userQuery);

  // Merge AI and fallback results
  return {
    error: null,
    structuredQuery: {
      ...aiQuery,
      conditions: [
        ...aiQuery.conditions,
        ...fallback.structuredQuery.conditions,
      ],
      fields: [
        ...new Set([...aiQuery.fields, ...fallback.structuredQuery.fields]),
      ],
    },
    intent: aiQuery.intent,
    confidence: (aiQuery.confidence + fallback.structuredQuery.confidence) / 2,
    usedAI: true,
    mode: "hybrid",
    enhanced: true,
  };
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
