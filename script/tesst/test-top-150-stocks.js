// Test Indian Stock Market API - Get Top 150 Stocks
const apiKey =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log("🇮🇳 GETTING TOP 150 STOCKS\n");
console.log("═══════════════════════════════════════════════════════════════");

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
    "Content-Type": "application/json",
  },
};

const fetchTop150Stocks = async () => {
  try {
    // Fetch NIFTY 500 index
    console.log("📊 Fetching NIFTY 500 Index Data...\n");
    const response = await fetch(`${apiBase}/api/index/NIFTY%20500`, options);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch NIFTY 500: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract stocks from index
    let allStocks = [];

    if (Array.isArray(data.data)) {
      allStocks = data.data;
    } else if (Array.isArray(data)) {
      allStocks = data;
    } else {
      throw new Error("Unexpected response structure");
    }

    // Take top 150 stocks (skip the index itself if present)
    const top150 = allStocks.slice(0, 150);

    console.log(`✅ Successfully fetched ${top150.length} stocks!\n`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    // Display in formatted table
    console.log(
      "Rank   Symbol       Company                               Price        Change     % Change  ",
    );
    console.log("─".repeat(85));

    top150.forEach((stock, index) => {
      const rank = (index + 1).toString().padEnd(6);
      const symbol = (stock.symbol || stock.identifier || "N/A")
        .substring(0, 11)
        .padEnd(12);
      const company = (stock.companyName || stock.name || "N/A")
        .substring(0, 34)
        .padEnd(35);
      const price = (stock.lastPrice || stock.close || "N/A")
        .toString()
        .substring(0, 11)
        .padEnd(12);
      const change = stock.change || stock.variation || "N/A";
      const percentChange = stock.pChange || stock.percentChange || "N/A";

      // Format change values
      const changeStr =
        typeof change === "number"
          ? (change >= 0 ? "+" : "") + change.toFixed(2)
          : String(change);
      const percentStr =
        typeof percentChange === "number"
          ? (percentChange >= 0 ? "+" : "") + percentChange.toFixed(2) + "%"
          : String(percentChange);

      const row =
        rank +
        symbol +
        company +
        price +
        changeStr.substring(0, 9).padEnd(10) +
        percentStr.substring(0, 9).padEnd(10);
      console.log(row);
    });

    console.log(
      "\n" + "═══════════════════════════════════════════════════════════════",
    );
    console.log("\n📈 SUMMARY:\n");

    // Calculate statistics
    const gainers = top150.filter((s) => (s.change || 0) > 0).length;
    const losers = top150.filter((s) => (s.change || 0) < 0).length;
    const avgChange =
      top150.reduce((sum, s) => sum + (s.change || 0), 0) / top150.length;

    // Sort by price to show price range
    const sorted = [...top150].sort(
      (a, b) => (a.lastPrice || 0) - (b.lastPrice || 0),
    );
    const minPrice = sorted[0]?.lastPrice || 0;
    const maxPrice = sorted[sorted.length - 1]?.lastPrice || 0;

    console.log("Total Stocks: " + top150.length);
    console.log("");
    console.log(
      "Price Range: ₹" + minPrice.toFixed(2) + " - ₹" + maxPrice.toFixed(2),
    );
    console.log("Gainers: " + gainers + " 📈");
    console.log("Losers: " + losers + " 📉");
    console.log("Average Change: " + avgChange.toFixed(2));

    console.log("\n✅ Top 150 stocks fetched successfully!");

    return top150;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
};

// Run the test
fetchTop150Stocks();
