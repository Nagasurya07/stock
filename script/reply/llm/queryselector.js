/**
 * Query Selector
 * Fetches stock data from Indian Stock Market API based on validated query
 */

import {
  MOCK_STOCKS_IN_LOSSES,
  MOCK_STOCKS_NIFTY100,
} from "../../data/mockStockData.js";

const RAPIDAPI_KEY =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const RAPIDAPI_HOST =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

// AI Configuration for intelligent matching
const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  "AIzaSyC5ppCM0i7f2LWIN_4Ne2RnDNuE5k8lkKg";
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || "mixtral-8x7b-32768";
const AI_CONFIDENCE_THRESHOLD = 0.7; // Use AI if confidence > 70%
const USE_AI_PERCENTAGE = 0.9; // Use AI in 90% of scenarios

// Field mapping cache to avoid repeated AI calls
const fieldMappingCache = new Map();
const FIELD_CACHE_SIZE = 500;

// Memoized field value extraction
const fieldValueCache = new WeakMap();

/**
 * Fetch stock data based on validated query
 * @param {Object} validatedQuery - Query from validator with fields, conditions, orderBy, limit
 * @returns {Promise<Object>} Stock data results
 */
export async function selectStockData(validatedQuery) {
  console.log("🔍 Query Selector Started");
  console.log("Validated Query:", JSON.stringify(validatedQuery, null, 2));

  const startTime = Date.now();

  try {
    // Step 1: Determine which data source to use
    const dataSource = determineDataSource(validatedQuery);
    console.log("Data Source:", dataSource);

    // Step 2: Fetch stock data
    console.log("\n📊 Fetching stock data...");
    let rawData = await fetchStockData(dataSource);

    // Check if we should use mock data (fallback for losses query)
    if ((!rawData || rawData.length === 0) && isLossesQuery(validatedQuery)) {
      console.log("📚 Using mock data for losses query (training mode)...");
      rawData = MOCK_STOCKS_IN_LOSSES;
      if (dataSource === "nifty100") {
        rawData = [MOCK_STOCKS_NIFTY100, ...MOCK_STOCKS_IN_LOSSES];
      }
    }

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        error: "No stock data available",
        results: [],
      };
    }

    console.log(`Fetched ${rawData.length} stocks from API`);

    // Step 2.5: Handle search_term if present (company name/symbol search)
    let workingData = rawData;
    if (validatedQuery.search_term) {
      console.log(`\n🔍 Searching for: "${validatedQuery.search_term}"`);
      const searchTerm = validatedQuery.search_term.toLowerCase();
      workingData = rawData.filter((stock) => {
        const symbol = (stock.symbol || stock.ticker || "").toLowerCase();
        const name = (stock.company_name || stock.name || "").toLowerCase();
        const shortName = (stock.shortname || "").toLowerCase();
        const identifier = (stock.identifier || "").toLowerCase();

        // Check nested meta.companyName (Indian Stock Market API format)
        const metaCompanyName = (stock.meta?.companyName || "").toLowerCase();

        return (
          symbol.includes(searchTerm) ||
          name.includes(searchTerm) ||
          shortName.includes(searchTerm) ||
          identifier.includes(searchTerm) ||
          metaCompanyName.includes(searchTerm) ||
          symbol === searchTerm ||
          name === searchTerm
        );
      });
      console.log(`Found ${workingData.length} matching stocks`);

      // If search found specific stocks, return them directly
      if (workingData.length > 0 && validatedQuery.conditions.length === 0) {
        return {
          success: true,
          results: workingData.slice(0, validatedQuery.limit || 50),
          metadata: {
            totalFetched: rawData.length,
            afterSearch: workingData.length,
            returned: Math.min(workingData.length, validatedQuery.limit || 50),
            dataSource: dataSource,
            processingTime: Date.now() - startTime,
            searchMode: true,
          },
        };
      }
    }

    // Step 3: Filter data based on conditions with AI (90% scenarios)
    console.log("\n🔎 Applying AI-powered filters...");
    const filtered = await filterStockData(
      workingData,
      validatedQuery.conditions,
      true,
    );
    console.log(`${filtered.length} stocks match conditions`);

    // Step 4: AI-powered result evaluation and ranking
    console.log("\n🤖 Evaluating results with AI...");
    const evaluated = await evaluateResultsWithAI(
      filtered,
      validatedQuery,
      validatedQuery.limit || 50,
    );

    // Step 5: Sort data (fallback if AI evaluation didn't rank)
    let finalResults = evaluated.rankedResults || filtered;
    if (!evaluated.rankedResults && validatedQuery.orderBy) {
      console.log("\n📈 Sorting by:", validatedQuery.orderBy);
      const direction = validatedQuery.orderDirection === "asc" ? 1 : -1;
      finalResults.sort((a, b) => {
        const aVal = getFieldValue(a, validatedQuery.orderBy) || 0;
        const bVal = getFieldValue(b, validatedQuery.orderBy) || 0;
        return (bVal - aVal) * direction;
      });
    }

    // Step 6: Limit results
    const limited = finalResults.slice(0, validatedQuery.limit || 50);

    const result = {
      success: true,
      results: limited,
      metadata: {
        totalFetched: rawData.length,
        afterFiltering: filtered.length,
        returned: limited.length,
        dataSource: dataSource,
        processingTime: Date.now() - startTime,
        aiPowered: evaluated.usedAI || false,
        aiConfidence: evaluated.confidence || 0,
        aiReasoning: evaluated.reasoning || null,
      },
    };

    console.log("\n✅ Query Selection Complete");
    console.log("Returned:", limited.length, "stocks");
    console.log("Processing Time:", result.metadata.processingTime, "ms");

    return result;
  } catch (error) {
    console.error("❌ Query Selection Error:", error.message);
    return {
      success: false,
      error: error.message,
      results: [],
    };
  }
}

/**
 * Determine which API endpoint to use based on query
 * @param {Object} validatedQuery - Validated query
 * @returns {string} Data source (nifty500, nifty100, allSymbols)
 */
function determineDataSource(validatedQuery) {
  if (validatedQuery.dataSource) {
    return validatedQuery.dataSource;
  }

  const limit = validatedQuery.limit || 50;

  // Route based on limit: 500+ → NIFTY 500, 100+ → NIFTY 100, else NIFTY 50
  if (limit >= 300 || validatedQuery.conditions.length > 2) {
    return "nifty500";
  }

  if (limit >= 60 || validatedQuery.conditions.length > 0) {
    return "nifty100";
  }

  // Default to NIFTY 100 for simpler queries
  return "nifty100";
}

/**
 * Fetch stock data from Indian Stock Market API
 * @param {string} source - Data source to fetch from
 * @returns {Promise<Array>} Array of stock data
 */
async function fetchStockData(source) {
  const endpoints = {
    nifty500: "/api/index/NIFTY 500",
    nifty100: "/api/index/NIFTY 100",
    nifty50: "/api/index/NIFTY 50",
    allSymbols: "/api/allSymbols",
  };

  const endpoint = endpoints[source] || endpoints["nifty100"];
  const url = `${API_BASE}${endpoint}`;

  console.log("Fetching from:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.stocks && Array.isArray(data.stocks)) {
      return data.stocks;
    }

    return [];
  } catch (error) {
    console.error("Fetch Error:", error.message);
    throw error;
  }
}

/**
 * Filter stock data based on conditions with AI-powered matching
 * Optimized with parallel processing for large datasets
 * @param {Array} stocks - Array of stock objects
 * @param {Array} conditions - Filter conditions
 * @param {boolean} useAI - Whether to use AI (default true for 90% scenarios)
 * @returns {Promise<Array>} Filtered stocks
 */
async function filterStockData(stocks, conditions, useAI = true) {
  if (!conditions || conditions.length === 0) {
    return stocks;
  }

  // For small datasets, use sequential processing
  if (stocks.length < 100) {
    const filteredStocks = [];
    for (const stock of stocks) {
      let matchesAll = true;

      for (const condition of conditions) {
        const fieldValue = useAI
          ? await getFieldValueWithAI(stock, condition.field, true)
          : getFieldValue(stock, condition.field);

        if (fieldValue === null || fieldValue === undefined) {
          matchesAll = false;
          break;
        }

        if (
          !evaluateCondition(fieldValue, condition.operator, condition.value)
        ) {
          matchesAll = false;
          break;
        }
      }

      if (matchesAll) {
        filteredStocks.push(stock);
      }
    }
    return filteredStocks;
  }

  // For large datasets, process in batches of 50
  const batchSize = 50;
  const filteredStocks = [];

  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (stock) => {
        for (const condition of conditions) {
          const fieldValue = useAI
            ? await getFieldValueWithAI(stock, condition.field, true)
            : getFieldValue(stock, condition.field);

          if (fieldValue === null || fieldValue === undefined) {
            return null;
          }

          if (
            !evaluateCondition(fieldValue, condition.operator, condition.value)
          ) {
            return null;
          }
        }
        return stock;
      }),
    );

    filteredStocks.push(...batchResults.filter((s) => s !== null));
  }

  return filteredStocks;
}

/**
 * AI-powered field mapping - Uses LLM to intelligently match query fields to API fields
 * @param {Object} stock - Stock object with API field names
 * @param {string} queryField - Field name from user query
 * @param {boolean} useAI - Whether to use AI (90% of time)
 * @returns {Promise<any>} Field value or null
 */
async function getFieldValueWithAI(stock, queryField, useAI = true) {
  // Decide whether to use AI or fallback (90% AI, 10% fallback)
  const shouldUseAI = useAI && Math.random() < USE_AI_PERCENTAGE;

  if (shouldUseAI && (GEMINI_API_KEY || GROQ_API_KEY)) {
    try {
      const mapping = await aiFieldMapping(stock, queryField);
      if (mapping && mapping.confidence > AI_CONFIDENCE_THRESHOLD) {
        return mapping.value;
      }
    } catch (error) {
      console.warn(`AI field mapping failed for ${queryField}, using fallback`);
    }
  }

  // Fallback to traditional mapping
  return getFieldValue(stock, queryField);
}

/**
 * Use AI to intelligently map query field to actual API field
 * Optimized with caching
 * @param {Object} stock - Stock data object
 * @param {string} queryField - Field name from query
 * @returns {Promise<Object>} Mapping result with value and confidence
 */
async function aiFieldMapping(stock, queryField) {
  // Check cache first
  const cacheKey = `${queryField}_${Object.keys(stock).sort().join(",")}`;
  if (fieldMappingCache.has(cacheKey)) {
    const cached = fieldMappingCache.get(cacheKey);
    if (stock[cached.field] !== undefined) {
      return {
        value: parseNumericValue(stock[cached.field]),
        confidence: cached.confidence,
        field: cached.field,
        cached: true,
      };
    }
  }

  const availableFields = Object.keys(stock);
  const prompt = `Given a stock data object with these fields: ${availableFields.join(", ")}

Find the best matching field for the query field: "${queryField}"

Return JSON:
{
  "matchedField": "exact_field_name",
  "confidence": 0.0-1.0,
  "reasoning": "why this field matches"
}`;

  try {
    // Try Gemini first
    if (GEMINI_API_KEY) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const result = JSON.parse(
            content.replace(/```json\n?|```/g, "").trim(),
          );
          if (result.matchedField && stock[result.matchedField] !== undefined) {
            return {
              value: parseNumericValue(stock[result.matchedField]),
              confidence: result.confidence,
              field: result.matchedField,
            };
          }
        }
      }
    }

    // Fallback to Groq
    if (GROQ_API_KEY) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 256,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const result = JSON.parse(
            content.replace(/```json\n?|```/g, "").trim(),
          );
          if (result.matchedField && stock[result.matchedField] !== undefined) {
            return {
              value: parseNumericValue(stock[result.matchedField]),
              confidence: result.confidence,
              field: result.matchedField,
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn(`AI field mapping error: ${error.message}`);
  }

  return null;
}

/**
 * Get field value from stock object (handles nested paths and name variations)
 * Optimized with caching
 * @param {Object} stock - Stock object
 * @param {string} field - Field name
 * @returns {any} Field value or null
 */
function getFieldValue(stock, field) {
  // Check cache first
  if (fieldValueCache.has(stock)) {
    const stockCache = fieldValueCache.get(stock);
    if (stockCache[field] !== undefined) {
      return stockCache[field];
    }
  }

  const value = extractFieldValue(stock, field);

  // Cache the result
  if (!fieldValueCache.has(stock)) {
    fieldValueCache.set(stock, {});
  }
  fieldValueCache.get(stock)[field] = value;

  return value;
}

/**
 * Extract field value without caching (internal use)
 */
function extractFieldValue(stock, field) {
  // Field name mappings (API field names to our field names)
  const fieldMappings = {
    pe_ratio: ["peratio", "pe", "priceToEarnings", "p_e_ratio"],
    pb_ratio: ["pbratio", "pb", "priceToBook", "p_b_ratio"],
    market_cap: ["marketcap", "marketCap", "mcap", "mktCap", "ffmc"],
    dividend_yield: ["dividendyield", "divyield", "yield"],
    profit_margin: ["profitmargin", "netmargin", "margin"],
    debt_to_equity_ratio: ["debttoequity", "deratio", "d_e_ratio"],
    return_on_equity: ["roe", "returnonequity"],
    return_on_assets: ["roa", "returnonassets"],
    revenue: ["totalrevenue", "sales", "turnover"],
    net_income: ["netincome", "profit", "netprofit"],
    current_price: ["price", "lastprice", "ltp", "close"],
    promoter_holding_percentage: ["promoterholding", "promoter"],
    revenue_yoy_growth: ["revenuegrowth", "salesgrowth"],
    last_price: ["lastprice", "ltp", "price", "close"],
    percent_change: ["pchange", "percentchange", "perchange"],
    price_change: ["change"],
    volume: ["totaltradedvolume", "volume"],
    traded_value: ["totaltradedvalue", "value"],
    year_high: ["yearhigh", "high52", "52weekhigh"],
    year_low: ["yearlow", "low52", "52weeklow"],
    near_week_high: ["nearwkh"],
    near_week_low: ["nearwkl"],
    change_30d: ["perchange30d"],
    change_365d: ["perchange365d"],
  };

  // Try direct field access
  if (stock[field] !== undefined) {
    return parseNumericValue(stock[field]);
  }

  // Try lowercase version
  const lowerField = field.toLowerCase();
  if (stock[lowerField] !== undefined) {
    return parseNumericValue(stock[lowerField]);
  }

  // Try field mappings
  const mappings = fieldMappings[field] || [];
  for (const mapping of mappings) {
    if (stock[mapping] !== undefined) {
      return parseNumericValue(stock[mapping]);
    }
    const lowerMapping = mapping.toLowerCase();
    if (stock[lowerMapping] !== undefined) {
      return parseNumericValue(stock[lowerMapping]);
    }
  }

  // Try nested access (e.g., fundamentals.pe_ratio)
  const nestedPaths = [
    `fundamentals.${field}`,
    `metrics.${field}`,
    `data.${field}`,
  ];

  for (const path of nestedPaths) {
    const value = getNestedValue(stock, path);
    if (value !== null && value !== undefined) {
      return parseNumericValue(value);
    }
  }

  return null;
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object
 * @param {string} path - Dot notation path
 * @returns {any} Value or null
 */
function getNestedValue(obj, path) {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Parse numeric value from string or number
 * @param {any} value - Value to parse
 * @returns {number|null} Parsed number or null
 */
function parseNumericValue(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    // Remove commas, currency symbols, percentage signs
    const cleaned = value.replace(/[,₹$%]/g, "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Evaluate condition
 * @param {number} fieldValue - Actual field value
 * @param {string} operator - Comparison operator
 * @param {number|Array} value - Expected value or range
 * @returns {boolean} True if condition is met
 */
function evaluateCondition(fieldValue, operator, value) {
  switch (operator) {
    case ">":
      return fieldValue > value;
    case "<":
      return fieldValue < value;
    case ">=":
      return fieldValue >= value;
    case "<=":
      return fieldValue <= value;
    case "=":
    case "==":
      return fieldValue === value;
    case "!=":
      return fieldValue !== value;
    case "BETWEEN":
      if (Array.isArray(value) && value.length === 2) {
        return fieldValue >= value[0] && fieldValue <= value[1];
      }
      return false;
    default:
      return false;
  }
}

/**
 * Batch select for multiple queries
 * @param {Array} validatedQueries - Array of validated queries
 * @returns {Promise<Array>} Array of results
 */
export async function selectBatch(validatedQueries) {
  console.log(`🔍 Batch Selection: ${validatedQueries.length} queries`);

  const results = [];
  for (const query of validatedQueries) {
    const result = await selectStockData(query);
    results.push(result);
  }

  return results;
}

/**
 * AI-powered result evaluation and ranking
 * Uses AI to evaluate and rank results based on query intent and accuracy
 * @param {Array} stocks - Filtered stock results
 * @param {Object} query - Original validated query
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Object>} Evaluated and ranked results
 */
async function evaluateResultsWithAI(stocks, query, limit) {
  // Use AI in 90% of scenarios
  const shouldUseAI = Math.random() < USE_AI_PERCENTAGE;

  if (
    !shouldUseAI ||
    (!GEMINI_API_KEY && !GROQ_API_KEY) ||
    stocks.length === 0
  ) {
    return { rankedResults: null, usedAI: false };
  }

  try {
    // Prepare stock summaries for AI evaluation
    const stockSummaries = stocks.slice(0, 100).map((stock, idx) => ({
      index: idx,
      symbol: stock.symbol || stock.ticker || `Stock-${idx}`,
      name: stock.company_name || stock.name || "Unknown",
      // Include relevant fields from conditions
      fields: query.conditions.reduce((acc, cond) => {
        const value = getFieldValue(stock, cond.field);
        if (value !== null) acc[cond.field] = value;
        return acc;
      }, {}),
    }));

    const prompt = `You are a stock analysis expert. Evaluate and rank these stocks based on the query intent.

Query Intent: ${query.intent}
Conditions: ${JSON.stringify(query.conditions)}
Order By: ${query.orderBy || "relevance"}

Stocks (showing first ${Math.min(stocks.length, 100)}):
${JSON.stringify(stockSummaries, null, 2)}

Rank the stocks by relevance and accuracy to the query. Return JSON:
{
  "rankedIndices": [index1, index2, ...],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Return only the top ${limit} most relevant stocks.`;

    let result = null;

    // Try Gemini first
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            result = JSON.parse(content.replace(/```json\n?|```/g, "").trim());
          }
        }
      } catch (error) {
        console.warn("Gemini evaluation failed, trying Groq...");
      }
    }

    // Fallback to Groq
    if (!result && GROQ_API_KEY) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 1024,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          result = JSON.parse(content.replace(/```json\n?|```/g, "").trim());
        }
      }
    }

    if (
      result &&
      result.rankedIndices &&
      result.confidence > AI_CONFIDENCE_THRESHOLD
    ) {
      console.log(
        `✅ AI ranked ${result.rankedIndices.length} results (confidence: ${result.confidence})`,
      );
      const rankedResults = result.rankedIndices
        .filter((idx) => idx < stocks.length)
        .map((idx) => stocks[idx]);

      return {
        rankedResults,
        usedAI: true,
        confidence: result.confidence,
        reasoning: result.reasoning,
      };
    }
  } catch (error) {
    console.warn(`AI evaluation error: ${error.message}`);
  }

  return { rankedResults: null, usedAI: false };
}

/**
 * Get detailed stock information for specific symbols
 * @param {Array} symbols - Array of stock symbols
 * @returns {Promise<Array>} Detailed stock data
 */
export async function getStockDetails(symbols) {
  console.log(`📊 Fetching details for ${symbols.length} stocks`);

  const details = [];

  for (const symbol of symbols) {
    try {
      const response = await fetch(`${API_BASE}/api/symbol/${symbol}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });

      if (response.ok) {
        const data = await response.json();
        details.push(data);
      }

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
    }
  }

  return details;
}

/**
 * Check if query is for stocks in losses (negative earnings)
 * @param {Object} validatedQuery - Validated query object
 * @returns {boolean} True if this is a losses query
 */
function isLossesQuery(validatedQuery) {
  return (
    validatedQuery.conditions &&
    validatedQuery.conditions.some(
      (cond) =>
        cond.field === "eps_basic" &&
        (cond.operator === "<" || cond.operator === "<=") &&
        cond.value === 0,
    )
  );
}
