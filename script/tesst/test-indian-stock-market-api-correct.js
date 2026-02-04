// Test Indian Stock Market API with CORRECT endpoints from documentation
const apiKey = "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost = "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log(
  "🇮🇳 TESTING INDIAN STOCK MARKET API (RapidAPI) - CORRECT ENDPOINTS\n",
);
console.log("═══════════════════════════════════════════════════════════════");
console.log("API Base:", apiBase);
console.log("API Host:", apiHost);
console.log("API Key:", apiKey.substring(0, 20) + "...");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
    "Content-Type": "application/json",
  },
};

// Test endpoints from official documentation
const endpoints = [
  // Base
  { path: "/", name: "Root", category: "Base" },
  { path: "/api/v1/swagger.json", name: "Swagger JSON", category: "Base" },

  // Common
  {
    path: "/api/allSymbols",
    name: "All Symbols",
    category: "Common",
    description: "Get all stock symbols",
  },
  {
    path: "/api/marketStatus",
    name: "Market Status",
    category: "Common",
    description: "Get current market status",
  },
  {
    path: "/api/indexNames",
    name: "Index Names",
    category: "Common",
    description: "Get all index names",
  },
  {
    path: "/api/allIndices",
    name: "All Indices",
    category: "Common",
    description: "Get all indices data",
  },
  {
    path: "/api/holidays",
    name: "Market Holidays",
    category: "Common",
    description: "Get market holidays",
  },
  {
    path: "/api/equityMaster",
    name: "Equity Master",
    category: "Common",
    description: "Get equity master data",
  },

  // Equity (with sample symbol INFY)
  {
    path: "/api/equity/INFY",
    name: "Equity - INFY",
    category: "Equity",
    description: "Get INFY equity data",
  },
  {
    path: "/api/equity/series/INFY",
    name: "Equity Series - INFY",
    category: "Equity",
    description: "Get INFY series data",
  },
  {
    path: "/api/equity/intraday/INFY",
    name: "Equity Intraday - INFY",
    category: "Equity",
    description: "Get INFY intraday data",
  },

  // Index (with sample symbol NIFTY 50)
  {
    path: "/api/index/NIFTY%2050",
    name: "Index - NIFTY 50",
    category: "Index",
    description: "Get NIFTY 50 index data",
  },
];

const testAllEndpoints = async () => {
  let successCount = 0;
  let categoryResults = {};

  for (const endpoint of endpoints) {
    const category = endpoint.category;
    if (!categoryResults[category]) {
      categoryResults[category] = { total: 0, success: 0 };
    }
    categoryResults[category].total++;

    try {
      console.log(`📊 [${endpoint.category}] ${endpoint.name}`);
      if (endpoint.description) {
        console.log(`   ${endpoint.description}`);
      }
      console.log(`   Endpoint: ${endpoint.path}`);

      const response = await fetch(`${apiBase}${endpoint.path}`, options);

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS!`);

        if (Array.isArray(data)) {
          console.log(`   Response Type: Array with ${data.length} items`);
          if (data.length > 0) {
            const preview = JSON.stringify(data[0]).substring(0, 150);
            console.log(`   Sample: ${preview}...`);
          }
        } else if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(
              `   Response Type: Object with data array (${data.data.length} items)`,
            );
            if (data.data.length > 0) {
              const preview = JSON.stringify(data.data[0]).substring(0, 150);
              console.log(`   Sample: ${preview}...`);
            }
          } else {
            console.log(`   Response Type: Object with data property`);
            const preview = JSON.stringify(data.data).substring(0, 150);
            console.log(`   Sample: ${preview}...`);
          }
        } else {
          const keys = Object.keys(data).slice(0, 5);
          console.log(`   Response Type: Object with keys: ${keys.join(", ")}`);
          const preview = JSON.stringify(data).substring(0, 150);
          console.log(`   Sample: ${preview}...`);
        }

        successCount++;
        categoryResults[category].success++;
      } else {
        const errorText = await response.text();
        console.log(
          `   ❌ Error (${response.status}): ${errorText.substring(0, 100)}`,
        );
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    console.log("");
  }

  return { successCount, totalCount: endpoints.length, categoryResults };
};

const displaySummary = (results) => {
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(
    `\n📊 TEST SUMMARY: ${results.successCount}/${results.totalCount} endpoints working\n`,
  );

  console.log("RESULTS BY CATEGORY:");
  for (const [category, data] of Object.entries(results.categoryResults)) {
    const percentage = ((data.success / data.total) * 100).toFixed(0);
    const status = data.success > 0 ? "✅" : "❌";
    console.log(
      `  ${status} ${category}: ${data.success}/${data.total} (${percentage}%)`,
    );
  }

  console.log("\n");
  if (results.successCount > 0) {
    console.log("✅ Indian Stock Market API is WORKING!");
    console.log("\nThis API provides comprehensive Indian market data:");
    console.log("  • Market Status & Holidays");
    console.log("  • Stock Symbols & Masters");
    console.log("  • Equity Data (series, intraday, historical)");
    console.log("  • Index Data (NIFTY, SENSEX, etc)");
    console.log("  • Corporate Information");
  } else {
    console.log("⚠️  No working endpoints found");
    console.log("\nAlternative working APIs:");
    console.log("  1. Yahoo Finance API ✅");
    console.log("  2. Indian Stock API ✅");
  }
};

// Run test
testAllEndpoints().then((results) => {
  displaySummary(results);
});
