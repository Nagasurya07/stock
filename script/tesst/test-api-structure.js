/**
 * Test Indian Stock Market API Response Structure
 * Check what fields are actually returned
 */

const RAPIDAPI_KEY = "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const RAPIDAPI_HOST = "indian-stock-market.p.rapidapi.com";

console.log("🔍 TESTING API RESPONSE STRUCTURE\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

async function testAPIStructure() {
  try {
    console.log("Fetching NIFTY 100 data...\n");

    const response = await fetch(
      `https://${RAPIDAPI_HOST}/api/index/NIFTY 100`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Response Type:", Array.isArray(data) ? "Array" : typeof data);
    console.log("Response Keys:", Object.keys(data).join(", "));

    // Handle different response formats
    let stocks = [];
    if (Array.isArray(data)) {
      stocks = data;
    } else if (data.data && Array.isArray(data.data)) {
      stocks = data.data;
    } else if (data.stocks && Array.isArray(data.stocks)) {
      stocks = data.stocks;
    } else {
      console.log("\nFull Response:");
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log("Total Stocks:", stocks.length);
    console.log(
      "\n═══════════════════════════════════════════════════════════════\n",
    );

    if (stocks.length > 0) {
      console.log("SAMPLE STOCK (First Entry):");
      console.log(JSON.stringify(stocks[0], null, 2));

      console.log(
        "\n═══════════════════════════════════════════════════════════════\n",
      );
      console.log("AVAILABLE FIELDS:");
      const fields = Object.keys(stocks[0]);
      fields.forEach((field, idx) => {
        const value = stocks[0][field];
        const type = typeof value;
        console.log(`${idx + 1}. ${field} (${type}): ${value}`);
      });

      console.log(
        "\n═══════════════════════════════════════════════════════════════\n",
      );
      console.log("SAMPLE STOCKS (First 5):");
      stocks.slice(0, 5).forEach((stock, idx) => {
        console.log(
          `\n${idx + 1}. ${stock.Symbol || stock.symbol || "Unknown"}`,
        );
        console.log(`   Available fields:`, Object.keys(stock).join(", "));
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAPIStructure();
