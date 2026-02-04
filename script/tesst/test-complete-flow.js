/**
 * Test Complete Query Flow with Data Fetching
 * Tests: Mistake Correction → LLM → Validation → Data Fetching
 */

import { transferQuery } from "../middleware/querytransfer.js";

console.log("🧪 COMPLETE QUERY FLOW TEST (WITH DATA FETCHING)\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Test queries
const testQueries = [
  "Show me stocks with PE ratio less than 20",
  "Find high dividend paying companies",
  "Stocks with market cap over 10000 crores",
];

async function runCompleteTest() {
  console.log(
    `📊 Testing ${testQueries.length} queries with full data fetching...\n`,
  );

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];

    console.log(`\n${"═".repeat(63)}`);
    console.log(`Test ${i + 1}/${testQueries.length}`);
    console.log(`${"═".repeat(63)}`);
    console.log(`Query: "${query}"\n`);

    try {
      const result = await transferQuery(query);

      if (result.success) {
        console.log("✅ COMPLETE SUCCESS!\n");

        // Query Processing
        console.log("📝 QUERY PROCESSING:");
        console.log("  Intent:", result.metadata.intent);
        console.log(
          "  Confidence:",
          (result.metadata.confidence * 100).toFixed(1) + "%",
        );
        console.log("  Corrected:", result.metadata.corrected ? "Yes" : "No");

        // Data Fetching
        console.log("\n📊 DATA FETCHING:");
        console.log("  Data Source:", result.metadata.dataSource);
        console.log("  Total Fetched:", result.metadata.totalStocksFetched);
        console.log("  After Filtering:", result.metadata.stocksAfterFiltering);
        console.log("  Returned:", result.metadata.stocksReturned);

        // Performance
        console.log("\n⚡ PERFORMANCE:");
        console.log("  Total Time:", result.metadata.processingTime + "ms");

        // Sample Results
        if (result.stockData && result.stockData.length > 0) {
          console.log("\n📈 SAMPLE RESULTS (Top 5):");
          result.stockData.slice(0, 5).forEach((stock, idx) => {
            console.log(
              `  ${idx + 1}. ${stock.symbol || stock.Symbol || "N/A"}`,
            );
            console.log(
              `     Price: ₹${stock.price || stock.lastprice || stock.close || "N/A"}`,
            );
            console.log(
              `     Change: ${stock.change || stock.pChange || "N/A"}%`,
            );
          });
        }
      } else {
        console.log("❌ FAILED\n");
        console.log("Error:", result.error);
        console.log("Stage:", result.stage);
      }
    } catch (error) {
      console.log("❌ ERROR:", error.message);
    }

    // Delay between requests
    if (i < testQueries.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next query...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log("✅ Complete flow test finished!");
  console.log("Flow: User Query → Correction → LLM → Validation → Data Fetch");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
}

runCompleteTest().catch(console.error);
