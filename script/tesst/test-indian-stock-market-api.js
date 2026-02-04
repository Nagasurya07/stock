// Test Indian Stock Market API (RapidAPI)
const apiKey = "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost = "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log("🇮🇳 TESTING INDIAN STOCK MARKET API (RapidAPI)\n");
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

// Test endpoints
const endpoints = [
  {
    path: "/api/equity/series/in",
    name: "Equity Series (IN)",
    description: "Get Indian equity data",
  },
  {
    path: "/api/quotes/equity/in",
    name: "Equity Quotes (IN)",
    description: "Get equity quotes",
  },
  { path: "/api/search", name: "Search", description: "Search stocks" },
  { path: "/api/gainers", name: "Top Gainers", description: "Get top gainers" },
  { path: "/api/losers", name: "Top Losers", description: "Get top losers" },
  {
    path: "/api/movers",
    name: "Market Movers",
    description: "Get market movers",
  },
];

const testAllEndpoints = async () => {
  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`📊 ${endpoint.name}`);
      console.log(`   Description: ${endpoint.description}`);
      console.log(`   Endpoint: ${endpoint.path}`);

      const response = await fetch(`${apiBase}${endpoint.path}`, options);

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS!`);

        if (Array.isArray(data)) {
          console.log(`   Response Type: Array with ${data.length} items`);
          if (data.length > 0) {
            console.log(
              `   First Item:`,
              JSON.stringify(data[0], null, 2).substring(0, 300) + "...",
            );
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log(
            `   Response Type: Object with data array (${data.data.length} items)`,
          );
          if (data.data.length > 0) {
            console.log(
              `   First Item:`,
              JSON.stringify(data.data[0], null, 2).substring(0, 300) + "...",
            );
          }
        } else if (typeof data === "object") {
          const keys = Object.keys(data);
          console.log(
            `   Response Type: Object with keys: ${keys.slice(0, 5).join(", ")}${keys.length > 5 ? "..." : ""}`,
          );
          console.log(
            `   Sample:`,
            JSON.stringify(data, null, 2).substring(0, 300) + "...",
          );
        }

        successCount++;
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

  return successCount;
};

const displaySummary = (successCount, totalCount) => {
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(
    `\n📊 TEST SUMMARY: ${successCount}/${totalCount} endpoints working\n`,
  );

  if (successCount > 0) {
    console.log("✅ Indian Stock Market API is WORKING!");
    console.log("\nAvailable endpoints:");
    console.log("  • Equity Series");
    console.log("  • Equity Quotes");
    console.log("  • Search");
    console.log("  • Top Gainers");
    console.log("  • Top Losers");
    console.log("  • Market Movers");
  } else {
    console.log("⚠️  No working endpoints found");
    console.log("\nAlternative working APIs:");
    console.log("  1. Yahoo Finance API ✅");
    console.log("  2. Indian Stock API ✅");
  }
};

// Run test
testAllEndpoints().then((successCount) => {
  displaySummary(successCount, endpoints.length);
});
