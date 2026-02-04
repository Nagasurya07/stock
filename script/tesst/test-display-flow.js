/**
 * Test Complete Query-to-Display Flow
 * Tests queryreplicat.js with real queries
 */

import { processQueryForDisplay } from "../middleware/queryreplicat.js";

async function testQueryFlow() {
  console.log("🧪 Testing Complete Query-to-Display Flow\n");
  console.log("=" * 60);

  const testQueries = [
    "Show me top 10 stocks",
    "Find stocks with high volume",
    "Stocks that gained more than 2% today",
    "Show me NIFTY 100 stocks",
    "Find stocks with price above 1000",
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];

    console.log(`\n\n📝 Test ${i + 1}/${testQueries.length}`);
    console.log(`Query: "${query}"`);
    console.log("-".repeat(60));

    try {
      const startTime = Date.now();
      const result = await processQueryForDisplay(query);
      const endTime = Date.now();

      if (result.success) {
        console.log("\n✅ SUCCESS");
        console.log(`\n💬 Display Message:`);
        console.log(result.displayMessage);

        console.log(`\n📊 Results:`);
        console.log(`   Total Cards: ${result.cards.length}`);
        console.log(`   Processing Time: ${endTime - startTime}ms`);

        if (result.cards.length > 0) {
          console.log(`\n🎴 Sample Cards (First 3):`);
          result.cards.slice(0, 3).forEach((card) => {
            console.log(`\n   #${card.rank} ${card.symbol}`);
            console.log(`   Company: ${card.company}`);
            console.log(`   Price: ${card.price}`);
            console.log(`   Change: ${card.change} (${card.percentChange})`);
          });
        }

        console.log(`\n📈 Metadata:`);
        console.log(`   Data Source: ${result.metadata?.dataSource || "N/A"}`);
        console.log(`   Query: ${result.metadata?.query || "N/A"}`);
      } else {
        console.log("\n❌ FAILED");
        console.log(`Error: ${result.error}`);
        console.log(`Display Message: ${result.displayMessage}`);
      }
    } catch (error) {
      console.log("\n❌ EXCEPTION");
      console.log(`Error: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }

    // Add delay between queries to avoid rate limits
    if (i < testQueries.length - 1) {
      console.log("\n⏳ Waiting 2 seconds before next query...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("🎉 All Tests Complete!");
}

// Run tests
testQueryFlow().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
