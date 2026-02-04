// Test Indian Stock Market API - Get Stocks < 10000 Rs
const apiKey =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const apiHost =
  process.env.EXPO_PUBLIC_INDIAN_STOCK_MARKET_API_HOST ||
  "indian-stock-market.p.rapidapi.com";
const apiBase = "https://indian-stock-market.p.rapidapi.com";

console.log("🇮🇳 FILTERING STOCKS BELOW 10,000 Rs\n");
console.log("═══════════════════════════════════════════════════════════════");

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
    "Content-Type": "application/json",
  },
};

const fetchStocksBelow10K = async () => {
  try {
    // Fetch NIFTY 100 index
    console.log("📊 Fetching NIFTY 100 Index Data...\n");
    const response = await fetch(`${apiBase}/api/index/NIFTY%20100`, options);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch NIFTY 100: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract all stocks
    let allStocks = [];

    if (Array.isArray(data.data)) {
      allStocks = data.data;
    } else if (Array.isArray(data)) {
      allStocks = data;
    } else {
      throw new Error("Unexpected response structure");
    }

    // Filter stocks below 10000 Rs
    const stocksBelow10K = allStocks.filter((stock) => {
      const price = stock.lastPrice || stock.close || 0;
      return price > 0 && price < 10000;
    });

    console.log(`✅ Found ${stocksBelow10K.length} stocks below 10,000 Rs!\n`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    // Display in formatted table
    console.log(
      "Rank   Symbol       Company                               Price        Change     % Change  ",
    );
    console.log("─".repeat(85));

    stocksBelow10K.forEach((stock, index) => {
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
    const gainers = stocksBelow10K.filter((s) => (s.change || 0) > 0).length;
    const losers = stocksBelow10K.filter((s) => (s.change || 0) < 0).length;
    const avgChange =
      stocksBelow10K.reduce((sum, s) => sum + (s.change || 0), 0) /
      stocksBelow10K.length;

    // Sort by price to show price range
    const sorted = [...stocksBelow10K].sort(
      (a, b) => (a.lastPrice || 0) - (b.lastPrice || 0),
    );
    const minPrice = sorted[0]?.lastPrice || 0;
    const maxPrice = sorted[sorted.length - 1]?.lastPrice || 0;

    console.log("Total Stocks: " + stocksBelow10K.length);
    console.log(
      "Price Range: " +
        minPrice.toFixed(2) +
        " Rs - " +
        maxPrice.toFixed(2) +
        " Rs",
    );
    console.log("Gainers: " + gainers + " 📈");
    console.log("Losers: " + losers + " 📉");
    console.log("Average Change: " + avgChange.toFixed(2));

    console.log("\n✅ Stocks below 10,000 Rs fetched successfully!");

    return stocksBelow10K;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
};

// Run the test
fetchStocksBelow10K();
