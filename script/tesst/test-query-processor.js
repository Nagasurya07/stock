/**
 * Test Query Processor
 * Tests the complete query flow: transfer -> preprocess -> validate
 */

import { transferQuery } from "../middleware/querytransfer.js";

console.log("🧪 QUERY PROCESSOR TEST\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Test queries
const testQueries = [
  "Show me stocks with PE ratio less than 15",
  "Find high dividend paying companies",
  "Stocks with market cap over 1000 crores and good profit margins",
  "Companies with debt to equity ratio below 1",
  "Top stocks by revenue growth",
  "Find companies with high promoter holding",
  "Stocks with low PE and high ROE",
  "Companies with strong profit margins and low debt",
];

async function runTests() {
  console.log(`📊 Testing ${testQueries.length} queries...\n`);

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];

    console.log(`\n${"─".repeat(63)}`);
    console.log(`Test ${i + 1}/${testQueries.length}`);
    console.log(`${"─".repeat(63)}`);
    console.log(`Query: "${query}"\n`);

    try {
      const result = await transferQuery(query);

      if (result.success) {
        console.log("✅ SUCCESS\n");
        console.log("Intent:", result.metadata.intent);
        console.log(
          "Confidence:",
          (result.metadata.confidence * 100).toFixed(1) + "%",
        );
        console.log("Fields Used:", result.metadata.fieldsUsed);
        console.log("Processing Time:", result.metadata.processingTime + "ms");

        console.log("\nValidated Query:");
        console.log(JSON.stringify(result.validatedQuery, null, 2));
      } else {
        console.log("❌ FAILED\n");
        console.log("Error:", result.error);
        console.log("Stage:", result.stage);

        if (result.invalidFields) {
          console.log("Invalid Fields:", result.invalidFields.join(", "));
        }

        if (result.suggestions) {
          console.log("\nSuggestions:");
          result.suggestions.forEach((s) => {
            console.log(`  "${s.invalid}" → ${s.suggestions.join(", ")}`);
          });
        }
      }
    } catch (error) {
      console.log("❌ ERROR:", error.message);
    }

    // Delay between requests to avoid rate limiting
    if (i < testQueries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log("✅ All tests complete!");
}

runTests().catch(console.error);
