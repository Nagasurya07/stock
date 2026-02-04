/**
 * Query Replicat
 * Processes user queries and formats results for frontend display
 */

import { selectStockData } from "../reply/llm/queryselector.js";
import { transferQuery } from "./querytransfer.js";

/**
 * Process user query and format results for frontend display
 * @param {string} userQuery - Natural language query from user
 * @returns {Promise<Object>} Formatted results with stock cards data
 */
export async function processQueryForDisplay(userQuery) {
  console.log("🎨 Query Replicat: Processing query for display...");
  console.log("User Query:", userQuery);

  try {
    // Step 1: Transfer and process query
    const result = await transferQuery(userQuery);

    if (!result.success) {
      const fallbackResult = await tryFallbackSelection(userQuery, result);
      if (fallbackResult) {
        return fallbackResult;
      }

      return {
        success: false,
        error: result.error || "Failed to process query",
        displayMessage:
          "❌ Sorry, I couldn't process your query. Please try again with different criteria.",
        cards: [],
      };
    }

    // Step 2: Format stock data for display
    const formattedCards = formatStockCards(result.stockData);

    // Step 3: Generate display message
    const displayMessage = generateDisplayMessage(result);

    // Step 4: Build final response
    return {
      success: true,
      displayMessage: displayMessage,
      cards: formattedCards,
      metadata: {
        totalResults: formattedCards.length,
        query: result.cleanedQuery,
        processingTime: result.metadata.processingTime,
        dataSource: result.metadata.dataSource,
      },
      rawData: result, // Include raw data for debugging
    };
  } catch (error) {
    console.error("❌ Query Replicat Error:", error.message);
    return {
      success: false,
      error: error.message,
      displayMessage:
        "❌ An error occurred while processing your query. Please try again.",
      cards: [],
    };
  }
}

/**
 * Fallback selection when LLM is rate-limited or unavailable
 * @param {string} userQuery - Original user query
 * @param {Object} transferResult - Result from transferQuery
 * @returns {Promise<Object|null>} Fallback response or null
 */
async function tryFallbackSelection(userQuery, transferResult) {
  const errorText = `${transferResult?.error || ""}`.toLowerCase();
  const isRateLimited =
    errorText.includes("429") || errorText.includes("quota");

  console.warn(
    isRateLimited
      ? "⚠️ LLM rate-limited. Using fallback query selection..."
      : "⚠️ LLM failed. Using fallback query selection...",
  );

  const normalizedQuery = userQuery.toLowerCase();
  const limit = extractLimit(normalizedQuery) || 10;

  const dataSource = normalizedQuery.includes("nifty 50")
    ? "nifty50"
    : normalizedQuery.includes("nifty 500")
      ? "nifty500"
      : normalizedQuery.includes("nifty 100")
        ? "nifty100"
        : null;

  const orderBy =
    normalizedQuery.includes("top") ||
    normalizedQuery.includes("gainers") ||
    normalizedQuery.includes("gain")
      ? "pChange"
      : normalizedQuery.includes("losers") || normalizedQuery.includes("loss")
        ? "pChange"
        : "lastPrice";

  // Extract price conditions from query (e.g., "<500", ">5000")
  const conditions = extractPriceConditions(normalizedQuery);

  const validatedQuery = {
    intent: "search",
    fields: [],
    conditions: conditions,
    orderBy,
    limit,
    dataSource,
    confidence: 0.2,
  };

  const stockResult = await selectStockData(validatedQuery);

  if (!stockResult.success) {
    return null;
  }

  const formattedCards = formatStockCards(stockResult.results);
  const reasonLine = isRateLimited
    ? "⚠️ AI is rate-limited right now. Showing a basic list instead.\n"
    : "⚠️ AI is temporarily unavailable. Showing a basic list instead.\n";

  const displayMessage =
    reasonLine +
    `✅ Found ${formattedCards.length} stock${
      formattedCards.length !== 1 ? "s" : ""
    } for your query.`;

  return {
    success: true,
    displayMessage,
    cards: formattedCards,
    metadata: {
      totalResults: formattedCards.length,
      query: userQuery,
      processingTime: 0,
      dataSource: stockResult.metadata.dataSource,
      fallback: true,
    },
    rawData: stockResult,
  };
}

/**
 * Extract price conditions from query text
 * Examples: "<500", ">5000", "<=10000", ">=1000"
 * @param {string} text - Query text (normalized/lowercase)
 * @returns {Array} Array of condition objects
 */
function extractPriceConditions(text) {
  const conditions = [];

  // Match patterns like <500, >5000, <=10000, >=1000, etc.
  const priceMatches = text.match(
    /([<>]=?|less than|greater than|above|below)\s*(\d+)/gi,
  );

  if (!priceMatches) {
    return conditions;
  }

  for (const match of priceMatches) {
    // Parse each match
    if (match.includes("<") || match.includes("less")) {
      const priceMatch = match.match(/(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1], 10);
        conditions.push({
          field: "lastPrice",
          operator: "<",
          value: price,
        });
        console.log(`💰 Detected price condition: price < ₹${price}`);
      }
    } else if (
      match.includes(">") ||
      match.includes("greater") ||
      match.includes("above")
    ) {
      const priceMatch = match.match(/(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1], 10);
        conditions.push({
          field: "lastPrice",
          operator: ">",
          value: price,
        });
        console.log(`💰 Detected price condition: price > ₹${price}`);
      }
    }
  }

  return conditions;
}

/**
 * Extract a numeric limit from query text
 * @param {string} text - Query text
 * @returns {number|null} Limit
 */
function extractLimit(text) {
  const match = text.match(/\btop\s+(\d+)\b|\b(\d+)\s+stocks?\b/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1] || match[2], 10);
  return Number.isNaN(value) ? null : value;
}

/**
 * Format stock data into card display format
 * @param {Array} stockData - Array of stock objects from API
 * @returns {Array} Formatted card data
 */
function formatStockCards(stockData) {
  if (!stockData || stockData.length === 0) {
    return [];
  }

  return stockData.map((stock, index) => {
    // Extract stock information
    const symbol = stock.symbol || "N/A";
    const company = getCompanyName(stock);
    const price = formatPrice(stock.lastPrice || stock.price || 0);
    const change = formatChange(stock.change || 0);
    const percentChange = formatPercentChange(
      stock.pChange || stock.percentChange || 0,
    );
    const rank = index + 1;

    // Determine color based on change
    const changeColor = getChangeColor(stock.change || 0);
    const percentChangeColor = getChangeColor(stock.pChange || 0);

    return {
      rank: rank,
      symbol: symbol,
      company: company,
      price: price,
      change: change,
      percentChange: percentChange,
      changeColor: changeColor,
      percentChangeColor: percentChangeColor,
      rawData: stock, // Include raw data for advanced features
    };
  });
}

/**
 * Get company name from stock object
 * @param {Object} stock - Stock object
 * @returns {string} Company name
 */
function getCompanyName(stock) {
  // Try different possible field names
  const possibleNames = [
    stock.companyName,
    stock.company,
    stock.name,
    stock.longName,
    stock.shortName,
    stock.symbol, // Fallback to symbol
  ];

  for (const name of possibleNames) {
    if (name && typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return "N/A";
}

/**
 * Format price with currency symbol
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
  if (typeof price !== "number" || isNaN(price)) {
    return "₹0.00";
  }

  // Format with Indian currency
  return `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format change value
 * @param {number} change - Change value
 * @returns {string} Formatted change with +/- sign
 */
function formatChange(change) {
  if (typeof change !== "number" || isNaN(change)) {
    return "₹0.00";
  }

  const sign = change >= 0 ? "+" : "";
  return `${sign}₹${change.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percent change
 * @param {number} percentChange - Percent change value
 * @returns {string} Formatted percent change
 */
function formatPercentChange(percentChange) {
  if (typeof percentChange !== "number" || isNaN(percentChange)) {
    return "0.00%";
  }

  const sign = percentChange >= 0 ? "+" : "";
  return `${sign}${percentChange.toFixed(2)}%`;
}

/**
 * Get color based on change value
 * @param {number} change - Change value
 * @returns {string} Color code
 */
function getChangeColor(change) {
  if (change > 0) {
    return "#10a37f"; // Green for positive
  } else if (change < 0) {
    return "#ef4444"; // Red for negative
  } else {
    return "#8e92a9"; // Gray for neutral
  }
}

/**
 * Generate display message based on query results
 * @param {Object} result - Query transfer result
 * @returns {string} Display message
 */
function generateDisplayMessage(result) {
  const { stockData, metadata } = result;
  const count = stockData.length;

  if (count === 0) {
    return generateNoResultsMessage(result);
  }

  // Build success message
  let message = `✅ Found ${count} stock${count > 1 ? "s" : ""} matching your query`;

  // Add filter info if available
  if (
    metadata.fieldsUsed &&
    Array.isArray(metadata.fieldsUsed) &&
    metadata.fieldsUsed.length > 0
  ) {
    message += `\n\n📊 Filtered by: ${metadata.fieldsUsed.join(", ")}`;
  }

  // Add data source info
  if (metadata.dataSource) {
    const sourceNames = {
      nifty500: "NIFTY 500",
      nifty100: "NIFTY 100",
      nifty50: "NIFTY 50",
    };
    message += `\n📈 Data source: ${sourceNames[metadata.dataSource] || metadata.dataSource}`;
  }

  // Add processing time
  if (metadata.processingTime) {
    message += `\n⏱️ Processing time: ${(metadata.processingTime / 1000).toFixed(2)}s`;
  }

  return message;
}

/**
 * Generate message when no results found
 * @param {Object} result - Query transfer result
 * @returns {string} No results message
 */
function generateNoResultsMessage(result) {
  let message =
    "📭 No stocks found matching your criteria.\n\n💡 Suggestions:\n";

  // Provide helpful suggestions
  message += "• Try broader search criteria\n";
  message += "• Check if field names are correct\n";
  message += "• Adjust numerical ranges\n";

  // Add what was searched
  if (result.metadata.fieldsUsed && result.metadata.fieldsUsed.length > 0) {
    message += `\n🔍 You searched for: ${result.metadata.fieldsUsed.join(", ")}`;
  }

  // Add info about available fields
  if (result.metadata.dataSource === "nifty500") {
    message +=
      "\n\n💭 Note: Some fundamental fields (PE ratio, dividend yield) may not be available in the current dataset.";
  }

  return message;
}

/**
 * Quick query processor for simple queries
 * @param {string} userQuery - User query
 * @returns {Promise<Object>} Simplified response
 */
export async function quickQuery(userQuery) {
  console.log("⚡ Quick Query:", userQuery);

  try {
    const result = await processQueryForDisplay(userQuery);

    return {
      success: result.success,
      message: result.displayMessage,
      stockCount: result.cards.length,
      cards: result.cards,
    };
  } catch (error) {
    console.error("❌ Quick Query Error:", error.message);
    return {
      success: false,
      message:
        "Failed to process query. Please check your internet connection and try again.",
      stockCount: 0,
      cards: [],
    };
  }
}

/**
 * Batch process multiple queries
 * @param {Array} queries - Array of user queries
 * @returns {Promise<Array>} Array of formatted results
 */
export async function processMultipleQueries(queries) {
  console.log(`🔄 Processing ${queries.length} queries...`);

  const results = [];

  for (const query of queries) {
    const result = await processQueryForDisplay(query);
    results.push(result);
  }

  return results;
}

/**
 * Format single stock for detail view
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Detailed stock information
 */
export async function getStockDetail(symbol) {
  console.log(`🔍 Fetching detail for: ${symbol}`);

  try {
    const query = `show me ${symbol}`;
    const result = await processQueryForDisplay(query);

    if (result.cards.length > 0) {
      return {
        success: true,
        stock: result.cards[0],
        message: `Stock details for ${symbol}`,
      };
    }

    return {
      success: false,
      message: `Stock ${symbol} not found`,
    };
  } catch (error) {
    console.error("❌ Stock Detail Error:", error.message);
    return {
      success: false,
      message: "Failed to fetch stock details",
    };
  }
}
