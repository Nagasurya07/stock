/**
 * Query Selector
 * Fetches stock data from Indian Stock Market API based on validated query
 */

const RAPIDAPI_KEY =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const RAPIDAPI_HOST =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

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
    const rawData = await fetchStockData(dataSource);

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        error: "No stock data available",
        results: [],
      };
    }

    console.log(`Fetched ${rawData.length} stocks from API`);

    // Step 3: Filter data based on conditions
    console.log("\n🔎 Applying filters...");
    const filtered = filterStockData(rawData, validatedQuery.conditions);
    console.log(`${filtered.length} stocks match conditions`);

    // Step 4: Sort data
    if (validatedQuery.orderBy) {
      console.log("\n📈 Sorting by:", validatedQuery.orderBy);
      filtered.sort((a, b) => {
        const aVal = getFieldValue(a, validatedQuery.orderBy) || 0;
        const bVal = getFieldValue(b, validatedQuery.orderBy) || 0;
        return bVal - aVal; // Descending order
      });
    }

    // Step 5: Limit results
    const limited = filtered.slice(0, validatedQuery.limit || 50);

    const result = {
      success: true,
      results: limited,
      metadata: {
        totalFetched: rawData.length,
        afterFiltering: filtered.length,
        returned: limited.length,
        dataSource: dataSource,
        processingTime: Date.now() - startTime,
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

  // If query needs many stocks with complex filters, use NIFTY 500
  if (validatedQuery.conditions.length > 0) {
    return "nifty500";
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
 * Filter stock data based on conditions
 * @param {Array} stocks - Array of stock objects
 * @param {Array} conditions - Filter conditions
 * @returns {Array} Filtered stocks
 */
function filterStockData(stocks, conditions) {
  if (!conditions || conditions.length === 0) {
    return stocks;
  }

  return stocks.filter((stock) => {
    // All conditions must be true (AND logic)
    return conditions.every((condition) => {
      const fieldValue = getFieldValue(stock, condition.field);

      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }

      return evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  });
}

/**
 * Get field value from stock object (handles nested paths and name variations)
 * @param {Object} stock - Stock object
 * @param {string} field - Field name
 * @returns {any} Field value or null
 */
function getFieldValue(stock, field) {
  // Field name mappings (API field names to our field names)
  const fieldMappings = {
    pe_ratio: ["peratio", "pe", "priceToEarnings", "p_e_ratio"],
    pb_ratio: ["pbratio", "pb", "priceToBook", "p_b_ratio"],
    market_cap: ["marketcap", "marketCap", "mcap", "mktCap"],
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
