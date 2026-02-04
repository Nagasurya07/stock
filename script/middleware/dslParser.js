/**
 * DSL Parser
 * Converts natural language stock screener queries into structured DSL
 */

import { VALID_FIELDS } from "./queryValidator.js";

const VALID_OPERATORS = ["<", ">", "<=", ">=", "=", "!="];
const VALID_SECTORS = [
  "Technology",
  "IT",
  "Financials",
  "Healthcare",
  "Consumer",
  "Energy",
  "Industrials",
  "Communication Services",
];

/**
 * System prompt for the LLM to convert natural language to DSL
 */
const SYSTEM_PROMPT = `You are a stock screener query parser. Convert natural language queries into a structured DSL format.

Database Schema:
- stocks: symbol, company_name, sector (${VALID_SECTORS.join(", ")}), industry, market_cap, employees
- fundamentals: pe_ratio, peg_ratio, pb_ratio, ps_ratio, dividend_yield, beta, eps, profit_margin, operating_margin, return_on_equity, return_on_assets, debt_to_equity_ratio, total_debt, free_cash_flow, debt_to_fcf_ratio
- shareholding: promoter_holding_percentage, institutional_holding_percentage, public_holding_percentage
- financials: revenue, ebitda, revenue_yoy_growth, ebitda_yoy_growth, gross_margin, net_margin
- earnings_analyst_data: earnings_date, estimated_eps, beat_probability, analyst_target_price_low, analyst_target_price_high, analyst_count, consensus_rating
- corporate_actions: action_type (stock_buyback, dividend, stock_split), announcement_date, amount

Valid operators: <, >, <=, >=, =, !=

Output JSON format:
{
  "sector": "string or null",
  "conditions": [
    {
      "field": "field_name",
      "operator": "< or > or = etc",
      "value": number or string
    }
  ],
  "specialFilters": {
    "hasUpcomingEarnings": boolean,
    "earningsWithinDays": number,
    "hasStockBuyback": boolean,
    "minAnalystCount": number
  }
}

Examples:
Query: "IT companies with PEG ratio less than 1.5"
Output: {"sector": "Technology", "conditions": [{"field": "peg_ratio", "operator": "<", "value": 1.5}], "specialFilters": {}}

Query: "Companies with upcoming earnings in 30 days and likely to beat estimates"
Output: {"sector": null, "conditions": [{"field": "beat_probability", "operator": ">", "value": 60}], "specialFilters": {"hasUpcomingEarnings": true, "earningsWithinDays": 30}}

Query: "Financial stocks with PE ratio below 15 and promoter holding above 50%"
Output: {"sector": "Financials", "conditions": [{"field": "pe_ratio", "operator": "<", "value": 15}, {"field": "promoter_holding_percentage", "operator": ">", "value": 50}], "specialFilters": {}}

Query: "Companies that announced stock buybacks"
Output: {"sector": null, "conditions": [], "specialFilters": {"hasStockBuyback": true}}

Query: "Healthcare stocks with promoter holding equal to 20%"
Output: {"sector": "Healthcare", "conditions": [{"field": "promoter_holding_percentage", "operator": "=", "value": 20}], "specialFilters": {}}

Query: "Stocks with dividend yield above 3.5%"
Output: {"sector": null, "conditions": [{"field": "dividend_yield", "operator": ">", "value": 3.5}], "specialFilters": {}}

IMPORTANT: 
- Only use fields from the schema above
- Always return valid JSON
- Use "Technology" or "IT" for tech sector
- **CRITICAL: For percentage fields (promoter_holding_percentage, institutional_holding_percentage, dividend_yield, profit_margin, etc.), use WHOLE NUMBERS: 50 means 50%, 20 means 20%, 100 means 100%. DO NOT convert to decimals.**
- Return empty specialFilters object if no special filters needed`;

/**
 * Validates the DSL structure
 */
export function validateDSL(dsl) {
  const errors = [];

  if (!dsl || typeof dsl !== "object") {
    return { valid: false, errors: ["DSL must be an object"] };
  }

  // Validate sector
  if (dsl.sector && !VALID_SECTORS.includes(dsl.sector)) {
    errors.push(
      `Invalid sector '${dsl.sector}'. Must be one of: ${VALID_SECTORS.join(", ")}`,
    );
  }

  // Validate conditions
  if (!Array.isArray(dsl.conditions)) {
    return { valid: false, errors: ["Conditions must be an array"] };
  }

  dsl.conditions.forEach((condition, index) => {
    if (!VALID_FIELDS.includes(condition.field)) {
      errors.push(`Condition ${index}: invalid field '${condition.field}'`);
    }
    if (!VALID_OPERATORS.includes(condition.operator)) {
      errors.push(
        `Condition ${index}: invalid operator '${condition.operator}'`,
      );
    }
    if (condition.value === undefined || condition.value === null) {
      errors.push(`Condition ${index}: value is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parses user query into DSL format using Groq (optional)
 */
export async function parseQueryToDSL(query) {
  try {
    // Validate input
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return {
        error: true,
        message: "Query must be a non-empty string",
        dsl: null,
      };
    }

    // Check if Groq API key is configured
    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "your-groq-api-key-here"
    ) {
      console.warn("Groq API key not configured, using fallback parser");
      return fallbackParser(query);
    }

    console.log(`Parsing query with LLM: "${query}"`);

    const completion = await callGroqChat(query);

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error("Invalid Groq response format");
    }

    const responseText = completion.choices[0].message.content;
    const dsl = JSON.parse(responseText);

    // Ensure specialFilters exists
    if (!dsl.specialFilters) {
      dsl.specialFilters = {};
    }

    // Validate the generated DSL
    const validation = validateDSL(dsl);
    if (!validation.valid) {
      return {
        error: true,
        message: "LLM generated invalid DSL",
        validationErrors: validation.errors,
        dsl: null,
      };
    }

    console.log("✓ Successfully parsed query with LLM");
    return {
      error: false,
      dsl,
      message: "Query parsed successfully",
      usedLLM: true,
    };
  } catch (error) {
    console.error("Error parsing query with LLM:", error.message);

    // Fallback to simple parser if LLM fails
    console.log("Falling back to simple parser...");
    return fallbackParser(query);
  }
}

/**
 * Fallback parser using simple keyword matching (when LLM is unavailable)
 */
export function fallbackParser(query) {
  try {
    const dsl = {
      sector: null,
      conditions: [],
      specialFilters: {},
    };

    const lowerQuery = query.toLowerCase();

    // Parse sector
    if (lowerQuery.includes("it") || lowerQuery.includes("technology")) {
      dsl.sector = "Technology";
    } else if (
      lowerQuery.includes("financial") ||
      lowerQuery.includes("finance")
    ) {
      dsl.sector = "Financials";
    } else if (
      lowerQuery.includes("healthcare") ||
      lowerQuery.includes("health")
    ) {
      dsl.sector = "Healthcare";
    }

    // Parse PEG ratio
    if (lowerQuery.includes("peg")) {
      const pegMatch = query.match(/peg.*?(less than|below|<)\s*(\d+\.?\d*)/i);
      const pegValue = pegMatch ? parseFloat(pegMatch[2]) : 1.5;
      dsl.conditions.push({
        field: "peg_ratio",
        operator: "<",
        value: pegValue,
      });
    }

    // Parse PE ratio
    if (lowerQuery.includes("pe") && !lowerQuery.includes("peg")) {
      const peMatch = query.match(/pe.*?(less than|below|<)\s*(\d+\.?\d*)/i);
      const peValue = peMatch ? parseFloat(peMatch[2]) : 15;
      dsl.conditions.push({
        field: "pe_ratio",
        operator: "<",
        value: peValue,
      });
    }

    // Parse promoter holding
    if (lowerQuery.includes("promoter")) {
      const promoterMatch = query.match(
        /promoter.*?(above|greater than|>)\s*(\d+\.?\d*)/i,
      );
      const promoterValue = promoterMatch ? parseFloat(promoterMatch[2]) : 50;
      dsl.conditions.push({
        field: "promoter_holding_percentage",
        operator: ">",
        value: promoterValue,
      });
    }

    // Parse debt
    if (lowerQuery.includes("debt")) {
      dsl.conditions.push({
        field: "debt_to_fcf_ratio",
        operator: "<",
        value: 0.25,
      });
    }

    // Parse earnings
    if (lowerQuery.includes("earnings") || lowerQuery.includes("earning")) {
      if (lowerQuery.includes("30 days") || lowerQuery.includes("upcoming")) {
        dsl.specialFilters.hasUpcomingEarnings = true;
        dsl.specialFilters.earningsWithinDays = 30;
      }
      if (lowerQuery.includes("beat")) {
        dsl.conditions.push({
          field: "beat_probability",
          operator: ">",
          value: 60,
        });
      }
    }

    // Parse buyback
    if (
      lowerQuery.includes("buyback") ||
      lowerQuery.includes("buy back") ||
      lowerQuery.includes("repurchase")
    ) {
      dsl.specialFilters.hasStockBuyback = true;
    }

    // Validate
    const validation = validateDSL(dsl);
    if (!validation.valid) {
      return {
        error: true,
        message: "Generated DSL is invalid",
        validationErrors: validation.errors,
        dsl: null,
      };
    }

    return {
      error: false,
      dsl,
      message: "Query parsed successfully (fallback parser)",
      usedLLM: false,
    };
  } catch (error) {
    console.error("Error in fallback parser:", error);
    return {
      error: true,
      message: "Failed to parse query",
      details: error.message,
      dsl: null,
    };
  }
}

/**
 * Future: Parse query using OpenAI with retry logic
 * @param {string} query - User's natural language query
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - DSL object or error
 */
export async function parseWithLLM(query, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await parseQueryToDSL(query);

      if (!result.error) {
        return result;
      }

      console.warn(`LLM parse attempt ${attempt} failed:`, result.message);
    } catch (error) {
      console.error(`LLM attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        return {
          error: true,
          message: `LLM failed after ${maxRetries} attempts`,
          details: error.message,
          dsl: null,
        };
      }
    }
  }
}

async function callGroqChat(query) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Parse this stock screener query: "${query}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

export { VALID_FIELDS, VALID_OPERATORS, VALID_SECTORS };
