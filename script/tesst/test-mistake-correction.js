/**
 * Test Query Mistake Correction
 * Tests automatic correction of common user mistakes
 */

import { transferQuery } from "../middleware/querytransfer.js";

console.log("🧪 QUERY MISTAKE CORRECTION TEST\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Test queries with common mistakes
const testQueries = [
  {
    input: "show stoks with pe ratoi less then 15",
    expected: "Corrects: stoks→stocks, ratoi→ratio, then→than",
  },
  {
    input: "find companys with high divident",
    expected: "Corrects: companys→companies, divident→dividend",
  },
  {
    input: "stok with merket cap over 1000 cr",
    expected: "Corrects: stok→stock, merket→market, cr→crores",
  },
  {
    input: "compnay with debit to equty less then 1",
    expected: "Corrects: compnay→company, debit→debt, equty→equity, then→than",
  },
  {
    input: "top stoks by revanue groth",
    expected: "Corrects: stoks→stocks, revanue→revenue, groth→growth",
  },
  {
    input: "find companys with promotr hoding > 50",
    expected: "Corrects: companys→companies, promotr→promoter, hoding→holding",
  },
  {
    input: "stoks with low pe and high roe",
    expected: "Corrects: stoks→stocks, expands pe/roe",
  },
  {
    input: "companys with good proft margn",
    expected: "Corrects: companys→companies, proft→profit, margn→margin",
  },
  {
    input: "show stok with marketcap > 5000 cr and div yield > 3",
    expected:
      "Corrects: stok→stock, marketcap→market cap, cr→crores, div→dividend",
  },
  {
    input: "   stoks   with   pe   less   then   20   ",
    expected: "Fixes extra spaces and spelling",
  },
];

async function runTests() {
  console.log(`📊 Testing ${testQueries.length} queries with mistakes...\n`);

  let successCount = 0;
  let correctionCount = 0;

  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];

    console.log(`\n${"─".repeat(63)}`);
    console.log(`Test ${i + 1}/${testQueries.length}`);
    console.log(`${"─".repeat(63)}`);
    console.log(`Original: "${test.input}"`);
    console.log(`Expected: ${test.expected}\n`);

    try {
      const result = await transferQuery(test.input);

      if (result.metadata?.corrected) {
        console.log("✏️  AUTO-CORRECTED");
        console.log("Cleaned Query:", result.cleanedQuery);
        correctionCount++;
      } else {
        console.log("No corrections needed");
      }

      if (result.success) {
        console.log("\n✅ PROCESSED SUCCESSFULLY");
        console.log("Intent:", result.metadata.intent);
        console.log(
          "Confidence:",
          (result.metadata.confidence * 100).toFixed(1) + "%",
        );
        console.log("Fields:", result.validatedQuery.fields.join(", "));
        successCount++;
      } else {
        console.log("\n❌ FAILED");
        console.log("Error:", result.error);
        console.log("Stage:", result.stage);
      }
    } catch (error) {
      console.log("\n❌ ERROR:", error.message);
    }

    // Delay to avoid rate limits
    if (i < testQueries.length - 1) {
      console.log("\nWaiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log("📊 TEST SUMMARY");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`Total Queries: ${testQueries.length}`);
  console.log(`Successfully Processed: ${successCount}`);
  console.log(`Auto-Corrected: ${correctionCount}`);
  console.log(
    `Success Rate: ${((successCount / testQueries.length) * 100).toFixed(1)}%`,
  );
  console.log(
    `Correction Rate: ${((correctionCount / testQueries.length) * 100).toFixed(1)}%`,
  );
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
}

runTests().catch(console.error);
