/**
 * Query Transfer Middleware
 * Routes user queries from Hero component to LLM preprocessor and validator
 */

import { preprocessQuery } from "../reply/llm/llmpreprocessor.js";
import { selectStockData } from "../reply/llm/queryselector.js";
import { validateQueryFields } from "./queryValidator.js";

// Common user mistakes and corrections
const COMMON_MISTAKES = {
  // Spelling mistakes
  stoks: "stocks",
  stok: "stock",
  companys: "companies",
  compnay: "company",
  companie: "company",
  divident: "dividend",
  dividand: "dividend",
  proft: "profit",
  proffit: "profit",
  revanue: "revenue",
  revenu: "revenue",
  merket: "market",
  markrt: "market",
  capitel: "capital",
  capitol: "capital",
  debit: "debt",
  equty: "equity",
  eqity: "equity",
  rateo: "ratio",
  rasio: "ratio",
  groth: "growth",
  growht: "growth",
  hoding: "holding",
  holdng: "holding",
  promotr: "promoter",
  promter: "promoter",
  institional: "institutional",
  instituional: "institutional",
  margn: "margin",
  margen: "margin",
  ebitda: "EBITDA",
  ebita: "EBITDA",

  // Common field mistakes
  "p/e ratio": "PE ratio",
  "p e ratio": "PE ratio",
  "pe ratoi": "PE ratio",
  "p/b ratio": "PB ratio",
  "p b ratio": "PB ratio",
  "roe ratio": "ROE",
  "roa ratio": "ROA",
  "market capitalisation": "market cap",
  marketcap: "market cap",
  "mkt cap": "market cap",
  "div yield": "dividend yield",
  "dividend yld": "dividend yield",
  "debt equity": "debt to equity",
  "d/e ratio": "debt to equity ratio",
  "promoter hold": "promoter holding",
  "institutional hold": "institutional holding",

  // Common phrases
  show: "show me",
  find: "find me",
  get: "get me",
  list: "show me",
  display: "show me",
  give: "show me",
  want: "show me",
  need: "show me",

  // Number variations
  "less then": "less than",
  "lesser than": "less than",
  "more then": "more than",
  "greater then": "greater than",
  "greter than": "greater than",
  "above then": "above",
  "below then": "below",
  "under then": "under",

  // Common abbreviations
  " cr ": " crores ",
  " cr.": " crores",
  crore: "crores",
  " k ": " thousand ",
  " m ": " million ",
  " b ": " billion ",
  lakh: "lakhs",
};

// Abbreviations to expand
const ABBREVIATIONS = {
  pe: "PE ratio",
  pb: "PB ratio",
  roe: "return on equity",
  roa: "return on assets",
  eps: "earnings per share",
  mcap: "market cap",
  div: "dividend",
  yoy: "year over year",
  qoq: "quarter over quarter",
};

/**
 * Clean and fix common user mistakes in query
 * @param {string} query - Raw user query
 * @returns {string} Cleaned query
 */
function cleanUserQuery(query) {
  let cleaned = query.toLowerCase().trim();

  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  // Remove trailing/leading punctuation
  cleaned = cleaned.replace(/^[.,!?;:]+|[.,!?;:]+$/g, "");

  // Fix common spelling mistakes
  Object.entries(COMMON_MISTAKES).forEach(([mistake, correction]) => {
    const regex = new RegExp(`\\b${mistake}\\b`, "gi");
    cleaned = cleaned.replace(regex, correction);
  });

  // Expand common abbreviations when standalone
  const words = cleaned.split(" ");
  const expandedWords = words.map((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, "");
    if (ABBREVIATIONS[cleanWord] && index > 0) {
      // Only expand if not at start and makes sense in context
      return ABBREVIATIONS[cleanWord];
    }
    return word;
  });
  cleaned = expandedWords.join(" ");

  // Fix common operator mistakes
  cleaned = cleaned.replace(/\s*<\s*=\s*/g, " <= ");
  cleaned = cleaned.replace(/\s*>\s*=\s*/g, " >= ");
  cleaned = cleaned.replace(/\s*<\s*/g, " less than ");
  cleaned = cleaned.replace(/\s*>\s*/g, " greater than ");
  cleaned = cleaned.replace(/\s*=\s*/g, " equals ");

  // Normalize number expressions
  cleaned = cleaned.replace(/(\d+)\s*(k|thousand)/gi, "$1000");
  cleaned = cleaned.replace(/(\d+)\s*(m|million)/gi, "$1000000");
  cleaned = cleaned.replace(/(\d+)\s*(b|billion)/gi, "$1000000000");

  return cleaned;
}

/**
 * Infer a result limit from query text
 * @param {string} query - Cleaned query text
 * @returns {number|null} Limit
 */
function inferLimitFromQuery(query) {
  const normalized = query.toLowerCase();
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
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  };

  const match = normalized.match(
    /\btop\s+(\d+|[a-z]+)\b|\b(\d+|[a-z]+)\s+stocks?\b/,
  );
  if (!match) {
    return null;
  }

  const rawValue = match[1] || match[2];
  const value = /\d+/.test(rawValue)
    ? parseInt(rawValue, 10)
    : wordNumberMap[rawValue];

  return Number.isNaN(value) || !value ? null : value;
}

function applyRuleBasedOverrides(query, structuredQuery) {
  const normalized = query.toLowerCase();
  const updated = {
    ...structuredQuery,
    fields: Array.isArray(structuredQuery.fields)
      ? [...structuredQuery.fields]
      : [],
    conditions: Array.isArray(structuredQuery.conditions)
      ? [...structuredQuery.conditions]
      : [],
  };

  const limit = inferLimitFromQuery(normalized);
  if (limit) {
    updated.limit = limit;
  }

  if (normalized.includes("nifty 500")) {
    updated.dataSource = "nifty500";
  } else if (normalized.includes("nifty 100")) {
    updated.dataSource = "nifty100";
  } else if (normalized.includes("nifty 50")) {
    updated.dataSource = "nifty50";
  }

  if (normalized.includes("top gainer") || normalized.includes("gainers")) {
    updated.intent = "gainers";
    updated.orderBy = "percent_change";
    updated.orderDirection = "desc";
    updated.conditions.push({
      field: "percent_change",
      operator: ">",
      value: 0,
    });
  }

  if (normalized.includes("loser") || normalized.includes("fell the most")) {
    updated.intent = "losers";
    updated.orderBy = "percent_change";
    updated.orderDirection = "asc";
    updated.conditions.push({
      field: "percent_change",
      operator: "<",
      value: 0,
    });
  }

  if (normalized.includes("most active") || normalized.includes("by volume")) {
    updated.intent = "most_active";
    updated.orderBy = "volume";
    updated.orderDirection = "desc";
  }

  if (normalized.includes("market sentiment")) {
    updated.intent = "sentiment";
    updated.orderBy = "percent_change";
    updated.orderDirection = "desc";
  }

  if (
    normalized.includes("52-week high") ||
    normalized.includes("52 week high")
  ) {
    updated.intent = "week_high";
    updated.conditions.push({
      field: "near_week_high",
      operator: "BETWEEN",
      value: [-1, 1],
    });
  }

  if (
    normalized.includes("52-week low") ||
    normalized.includes("52 week low")
  ) {
    updated.intent = "week_low";
    updated.conditions.push({
      field: "near_week_low",
      operator: "BETWEEN",
      value: [-1, 1],
    });
  }

  if (
    normalized.includes("near 52-week low") ||
    normalized.includes("near 52 week low")
  ) {
    updated.intent = "near_week_low";
    updated.conditions.push({
      field: "near_week_low",
      operator: "BETWEEN",
      value: [-5, 5],
    });
  }

  if (
    normalized.includes("unusual trading") ||
    normalized.includes("unusual activity")
  ) {
    updated.intent = "unusual_activity";
    updated.orderBy = "volume";
    updated.orderDirection = "desc";
    if (!updated.limit) {
      updated.limit = 20;
    }
  }

  if (normalized.includes("midcap")) {
    updated.intent = "midcap";
    updated.conditions.push({
      field: "market_cap",
      operator: "BETWEEN",
      value: [1e11, 5e11],
    });
  }

  return { structuredQuery: updated };
}

/**
 * Validate basic query structure
 * @param {string} query - User query
 * @returns {Object} Validation result
 */
function validateQueryStructure(query) {
  const errors = [];
  const warnings = [];

  // Check if query is too short
  if (query.length < 5) {
    errors.push("Query is too short. Please provide more details.");
  }

  // Check if query is empty or just spaces
  if (!query.trim()) {
    errors.push("Query cannot be empty.");
  }

  // Check if query is too long
  if (query.length > 500) {
    warnings.push(
      "Query is very long. Consider breaking it into smaller queries.",
    );
  }

  // Check if query contains numbers but no context
  if (/^\d+$/.test(query.trim())) {
    errors.push(
      'Query contains only numbers. Please add context (e.g., "stocks with PE less than 15").',
    );
  }

  // Check for common patterns that need more info
  if (/^(good|best|top|high|low)$/i.test(query.trim())) {
    errors.push(
      'Query needs more context. Example: "stocks with high dividend yield" or "top stocks by revenue growth".',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Transfer and process user query
 * @param {string} userQuery - Raw query from user input
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processed query result
 */
export async function transferQuery(userQuery, options = {}) {
  const startTime = Date.now();

  console.log("📤 Query Transfer Started");
  console.log("Raw Query:", userQuery);

  try {
    // Step 0: Validate basic structure
    console.log("\n🔍 Step 0: Basic Validation...");
    const validation = validateQueryStructure(userQuery);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(" "),
        stage: "validation",
        rawQuery: userQuery,
      };
    }

    if (validation.warnings.length > 0) {
      console.log("⚠️  Warnings:", validation.warnings.join(" "));
    }

    // Step 0.5: Clean user query
    console.log("\n🧹 Cleaning user query...");
    const cleanedQuery = cleanUserQuery(userQuery);

    if (cleanedQuery !== userQuery.toLowerCase()) {
      console.log("Corrected Query:", cleanedQuery);
    }

    // Step 1: Preprocess with LLM
    console.log("\n🤖 Step 1: LLM Preprocessing...");
    const preprocessed = await preprocessQuery(cleanedQuery, options);

    if (preprocessed.error) {
      return {
        success: false,
        error: preprocessed.error,
        stage: "preprocessing",
        rawQuery: userQuery,
      };
    }

    const inferredLimit = inferLimitFromQuery(cleanedQuery);
    if (
      inferredLimit &&
      (!preprocessed.structuredQuery.limit ||
        preprocessed.structuredQuery.limit < inferredLimit)
    ) {
      console.log(`📊 Applying inferred limit: ${inferredLimit}`);
      preprocessed.structuredQuery.limit = inferredLimit;
    }

    const ruleBased = applyRuleBasedOverrides(
      cleanedQuery,
      preprocessed.structuredQuery,
    );
    if (ruleBased) {
      preprocessed.structuredQuery = ruleBased.structuredQuery;
      preprocessed.intent =
        ruleBased.structuredQuery.intent || preprocessed.intent;
    }

    // Step 2: Validate fields
    console.log("\n✅ Step 2: Field Validation...");
    const validated = validateQueryFields(preprocessed.structuredQuery);

    if (!validated.isValid) {
      return {
        success: false,
        error: "Invalid database fields detected",
        invalidFields: validated.invalidFields,
        suggestions: validated.suggestions,
        stage: "validation",
        preprocessedQuery: preprocessed.structuredQuery,
      };
    }

    // Step 3: Fetch stock data
    console.log("\n📊 Step 3: Fetching Stock Data...");
    const stockData = await selectStockData(validated.cleanQuery);

    if (!stockData.success) {
      return {
        success: false,
        error: stockData.error,
        stage: "data_fetching",
        validatedQuery: validated.cleanQuery,
      };
    }

    // Step 4: Build final result
    const result = {
      success: true,
      originalQuery: userQuery,
      cleanedQuery: cleanedQuery,
      preprocessedQuery: preprocessed.structuredQuery,
      validatedQuery: validated.cleanQuery,
      stockData: stockData.results,
      metadata: {
        intent: preprocessed.intent,
        confidence: preprocessed.confidence,
        fieldsUsed: validated.fieldsUsed,
        totalStocksFetched: stockData.metadata.totalFetched,
        stocksAfterFiltering: stockData.metadata.afterFiltering,
        stocksReturned: stockData.metadata.returned,
        dataSource: stockData.metadata.dataSource,
        processingTime: Date.now() - startTime,
        corrected: cleanedQuery !== userQuery.toLowerCase(),
        warnings: validation.warnings,
      },
    };

    console.log("\n✅ Query Transfer Complete");
    console.log("Processing Time:", result.metadata.processingTime, "ms");
    console.log("Stocks Returned:", result.metadata.stocksReturned);

    if (result.metadata.corrected) {
      console.log("✏️  Auto-corrected:", userQuery, "→", cleanedQuery);
    }

    return result;
  } catch (error) {
    console.error("❌ Query Transfer Error:", error.message);
    return {
      success: false,
      error: error.message,
      stage: "transfer",
      rawQuery: userQuery,
    };
  }
}

/**
 * Batch process multiple queries
 * @param {string[]} queries - Array of user queries
 * @returns {Promise<Object[]>} Array of processed results
 */
export async function transferQueries(queries) {
  console.log(`📤 Batch Transfer: ${queries.length} queries`);

  const results = [];
  for (const query of queries) {
    const result = await transferQuery(query);
    results.push(result);
  }

  return results;
}

/**
 * Stream query processing with progress callback
 * @param {string} userQuery - Raw query from user
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Final result
 */
export async function transferQueryWithProgress(userQuery, onProgress) {
  onProgress?.({ stage: "started", progress: 0 });

  onProgress?.({ stage: "preprocessing", progress: 30 });
  const preprocessed = await preprocessQuery(userQuery);

  if (preprocessed.error) {
    onProgress?.({ stage: "error", progress: 100, error: preprocessed.error });
    return { success: false, error: preprocessed.error };
  }

  onProgress?.({ stage: "validating", progress: 70 });
  const validated = validateQueryFields(preprocessed.structuredQuery);

  onProgress?.({ stage: "complete", progress: 100 });

  return {
    success: validated.isValid,
    originalQuery: userQuery,
    preprocessedQuery: preprocessed.structuredQuery,
    validatedQuery: validated.cleanQuery,
    metadata: {
      intent: preprocessed.intent,
      confidence: preprocessed.confidence,
      fieldsUsed: validated.fieldsUsed,
    },
  };
}
