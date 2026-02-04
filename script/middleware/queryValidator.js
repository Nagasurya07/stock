/**
 * Query Field Validator
 * Validates structured queries against database schema
 */

// Valid database fields across all tables
export const VALID_FIELDS = [
  // Fundamentals table
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
  // Shareholding table
  "promoter_holding_percentage",
  "institutional_holding_percentage",
  "public_holding_percentage",
  "foreign_institutional_holding",
  "domestic_institutional_holding",
  "mutual_fund_holding",
  "retail_holding",
  "promoter_pledge_percentage",
  // Stocks table
  "market_cap",
  "employees",
  "average_volume",
  "shares_outstanding",
  "insider_ownership_percentage",
  "institutional_ownership_percentage",
  // Financials table
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
  // Earnings table
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

// Field aliases (common variations)
const FIELD_ALIASES = {
  "p/e": "pe_ratio",
  pe: "pe_ratio",
  price_to_earnings: "pe_ratio",
  "p/b": "pb_ratio",
  pb: "pb_ratio",
  price_to_book: "pb_ratio",
  roe: "return_on_equity",
  roa: "return_on_assets",
  mcap: "market_cap",
  marketcap: "market_cap",
  div_yield: "dividend_yield",
  dividend: "dividend_yield",
  debt_equity: "debt_to_equity_ratio",
  de_ratio: "debt_to_equity_ratio",
  profit: "profit_margin",
  net_profit: "net_margin",
  promoter_holding: "promoter_holding_percentage",
  institutional_holding: "institutional_holding_percentage",
};

// Valid operators
const VALID_OPERATORS = [
  ">",
  "<",
  ">=",
  "<=",
  "=",
  "!=",
  "BETWEEN",
  "IN",
  "LIKE",
];

/**
 * Validate query fields against database schema
 * @param {Object} structuredQuery - Query from LLM preprocessor
 * @returns {Object} Validation result
 */
export function validateQueryFields(structuredQuery) {
  if (!structuredQuery) {
    return {
      isValid: false,
      error: "No query provided",
      invalidFields: [],
      suggestions: [],
    };
  }

  const invalidFields = [];
  const suggestions = [];
  const validatedFields = [];
  const validatedConditions = [];

  // Validate fields array
  if (structuredQuery.fields && Array.isArray(structuredQuery.fields)) {
    for (const field of structuredQuery.fields) {
      const normalized = normalizeFieldName(field);

      if (VALID_FIELDS.includes(normalized)) {
        validatedFields.push(normalized);
      } else if (FIELD_ALIASES[normalized.toLowerCase()]) {
        validatedFields.push(FIELD_ALIASES[normalized.toLowerCase()]);
      } else {
        invalidFields.push(field);
        const fieldSuggestions = suggestFields(field);
        if (fieldSuggestions.length > 0) {
          suggestions.push({
            invalid: field,
            suggestions: fieldSuggestions,
          });
        }
      }
    }
  }

  // Validate conditions
  if (structuredQuery.conditions && Array.isArray(structuredQuery.conditions)) {
    for (const condition of structuredQuery.conditions) {
      const normalizedField = normalizeFieldName(condition.field);

      // Check if field is valid
      let validField = normalizedField;
      if (!VALID_FIELDS.includes(normalizedField)) {
        if (FIELD_ALIASES[normalizedField.toLowerCase()]) {
          validField = FIELD_ALIASES[normalizedField.toLowerCase()];
        } else {
          invalidFields.push(condition.field);
          continue;
        }
      }

      // Check if operator is valid
      if (!VALID_OPERATORS.includes(condition.operator)) {
        invalidFields.push(
          `${condition.field} (invalid operator: ${condition.operator})`,
        );
        continue;
      }

      validatedConditions.push({
        field: validField,
        operator: condition.operator,
        value: condition.value,
        unit: condition.unit,
      });
    }
  }

  // Validate orderBy field
  let validatedOrderBy = null;
  if (structuredQuery.orderBy) {
    const normalized = normalizeFieldName(structuredQuery.orderBy);
    if (VALID_FIELDS.includes(normalized)) {
      validatedOrderBy = normalized;
    } else if (FIELD_ALIASES[normalized.toLowerCase()]) {
      validatedOrderBy = FIELD_ALIASES[normalized.toLowerCase()];
    }
  }

  const isValid = invalidFields.length === 0;

  return {
    isValid,
    invalidFields: [...new Set(invalidFields)],
    suggestions,
    cleanQuery: {
      intent: structuredQuery.intent,
      fields: validatedFields,
      conditions: validatedConditions,
      orderBy: validatedOrderBy,
      limit: structuredQuery.limit || 50,
      confidence: structuredQuery.confidence || 0.8,
    },
    fieldsUsed: validatedFields.length + validatedConditions.length,
  };
}

/**
 * Normalize field name (remove special chars, convert to lowercase)
 */
function normalizeFieldName(field) {
  return field.toLowerCase().trim().replace(/\s+/g, "_");
}

/**
 * Suggest similar valid fields for invalid field name
 * @param {string} fieldName - Invalid field name
 * @returns {string[]} Array of suggestions
 */
function suggestFields(fieldName) {
  const normalized = fieldName.toLowerCase().replace(/[_\s-]/g, "");

  const suggestions = VALID_FIELDS.filter((validField) => {
    const validNormalized = validField.toLowerCase().replace(/[_\s-]/g, "");

    // Exact substring match
    if (
      validNormalized.includes(normalized) ||
      normalized.includes(validNormalized)
    ) {
      return true;
    }

    // Levenshtein distance
    if (levenshteinDistance(normalized, validNormalized) <= 3) {
      return true;
    }

    return false;
  });

  return suggestions.slice(0, 5);
}

/**
 * Calculate Levenshtein distance
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

/**
 * Check if a value is valid for a given field
 * @param {string} field - Database field name
 * @param {any} value - Value to validate
 * @returns {boolean} Is valid
 */
export function validateFieldValue(field, value) {
  // Percentage fields (0-100)
  const percentageFields = [
    "dividend_yield",
    "profit_margin",
    "operating_margin",
    "return_on_equity",
    "return_on_assets",
    "gross_margin",
    "net_margin",
    "promoter_holding_percentage",
    "institutional_holding_percentage",
    "public_holding_percentage",
    "insider_ownership_percentage",
    "institutional_ownership_percentage",
    "promoter_pledge_percentage",
  ];

  if (percentageFields.includes(field)) {
    return typeof value === "number" && value >= 0 && value <= 100;
  }

  // Ratio fields (typically 0-100, but can be higher)
  const ratioFields = [
    "pe_ratio",
    "peg_ratio",
    "pb_ratio",
    "ps_ratio",
    "current_ratio",
    "quick_ratio",
  ];
  if (ratioFields.includes(field)) {
    return typeof value === "number" && value >= 0;
  }

  // Positive number fields
  if (typeof value === "number") {
    return value >= 0;
  }

  return true;
}

/**
 * Get field type for validation
 * @param {string} field - Database field name
 * @returns {string} Field type (number, percentage, ratio, currency, date, string)
 */
export function getFieldType(field) {
  const percentageFields = [
    "dividend_yield",
    "profit_margin",
    "operating_margin",
    "return_on_equity",
    "return_on_assets",
    "gross_margin",
    "net_margin",
    "promoter_holding_percentage",
    "institutional_holding_percentage",
  ];

  const ratioFields = [
    "pe_ratio",
    "peg_ratio",
    "pb_ratio",
    "ps_ratio",
    "current_ratio",
    "quick_ratio",
    "debt_to_equity_ratio",
  ];

  const currencyFields = [
    "market_cap",
    "revenue",
    "ebitda",
    "gross_profit",
    "operating_income",
    "net_income",
    "free_cash_flow",
    "total_debt",
    "expected_revenue",
    "current_price",
  ];

  const dateFields = ["earnings_date"];

  if (percentageFields.includes(field)) return "percentage";
  if (ratioFields.includes(field)) return "ratio";
  if (currencyFields.includes(field)) return "currency";
  if (dateFields.includes(field)) return "date";

  return "number";
}
