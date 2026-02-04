// Test Indian Stock Market API - Get 500+ Stocks from Multiple Indices
const apiKey =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log("🇮🇳 GETTING 500+ STOCKS FROM MULTIPLE INDICES\n");
console.log("═══════════════════════════════════════════════════════════════");

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
    "Content-Type": "application/json",
  },
};

const fetchStocks500Plus = async () => {
  try {
    // Fetch NIFTY 500 which should have 500 stocks
    console.log("📊 Fetching NIFTY 500 Index (contains 500 stocks)...\n");
    const response = await fetch(`${apiBase}/api/index/NIFTY%20500`, options);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch NIFTY 500: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract stocks from index
    let stocks = [];

    if (Array.isArray(data.data)) {
      stocks = data.data;
    } else if (Array.isArray(data)) {
      stocks = data;
    } else {
      console.log("Response structure:", Object.keys(data));
      throw new Error("Unexpected response structure");
    }

    console.log(`✅ Successfully fetched ${stocks.length} stocks!\n`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    // Display first 100 in formatted table
    console.log("Showing First 100 Stocks from NIFTY 500:\n");
    console.log(
      "Rank   Symbol       Company                               Price        Change     % Change  ",
    );
    console.log("─".repeat(85));

    stocks.slice(0, 100).forEach((stock, index) => {
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
    const gainers = stocks.filter((s) => (s.change || 0) > 0).length;
    const losers = stocks.filter((s) => (s.change || 0) < 0).length;
    const avgChange =
      stocks.reduce((sum, s) => sum + (s.change || 0), 0) / stocks.length;

    // Sort by price to show price range
    const sorted = [...stocks].sort(
      (a, b) => (a.lastPrice || 0) - (b.lastPrice || 0),
    );
    const minPrice = sorted[0]?.lastPrice || 0;
    const maxPrice = sorted[sorted.length - 1]?.lastPrice || 0;

    console.log("Total Stocks in NIFTY 500: " + stocks.length);
    console.log("");
    console.log(
      "Price Range: ₹" + minPrice.toFixed(2) + " - ₹" + maxPrice.toFixed(2),
    );
    console.log("Gainers: " + gainers + " 📈");
    console.log("Losers: " + losers + " 📉");
    console.log("Average Change: " + avgChange.toFixed(2));

    console.log(
      "\n✅ " + stocks.length + " stocks fetched successfully from NIFTY 500!",
    );
    console.log("(Complete list available for app integration)");

    return stocks;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
};

// Run the test
fetchStocks500Plus();
