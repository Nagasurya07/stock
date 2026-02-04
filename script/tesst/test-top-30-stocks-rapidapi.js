// Test Indian Stock Market API - Get Top 100 Stocks
const apiKey =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log("🇮🇳 GETTING TOP 100 STOCKS FROM NIFTY 100\n");
console.log("═══════════════════════════════════════════════════════════════");

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
    "Content-Type": "application/json",
  },
};

const fetchTop100Stocks = async () => {
  try {
    // Fetch NIFTY 100 index which contains top 100 stocks
    console.log("📊 Fetching NIFTY 100 Index Data...\n");
    const response = await fetch(`${apiBase}/api/index/NIFTY%20100`, options);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch NIFTY 100: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract top 100 stocks from the data array
    let stocks = [];

    if (Array.isArray(data.data)) {
      stocks = data.data.slice(0, 100);
    } else if (Array.isArray(data)) {
      stocks = data.slice(0, 100);
    } else {
      console.log("Response structure:", Object.keys(data));
      throw new Error("Unexpected response structure");
    }

    console.log(`✅ Successfully fetched ${stocks.length} stocks!\n`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    // Display in formatted table
    console.log(
      "Rank   Symbol       Company                               Price        Change     % Change  ",
    );
    console.log("─".repeat(85));

    stocks.forEach((stock, index) => {
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

    console.log("Total Stocks: " + stocks.length);
    console.log("Gainers: " + gainers + " 📈");
    console.log("Losers: " + losers + " 📉");
    console.log("Average Change: " + avgChange.toFixed(2));

    console.log("\n✅ Top 100 stocks fetched successfully from NIFTY 100!");

    return stocks;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
};

// Run the test
fetchTop100Stocks();
