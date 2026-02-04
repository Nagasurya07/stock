// Test OpenAI API with Different Models
const apiKey = process.env.OPENAI_API_KEY || "your-openai-api-key-here";
const apiBase = "https://api.openai.com/v1";

console.log("🤖 TESTING OPENAI API WITH DIFFERENT MODELS\n");
console.log("═══════════════════════════════════════════════════════════════");

const models = ["gpt-4-mini", "gpt-3.5-turbo", "gpt-4-turbo", "gpt-4"];

const testModel = async (model) => {
  try {
    console.log(`\n📊 Testing model: ${model}...`);

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: "What is the Indian stock market? Answer in one sentence.",
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ SUCCESS with ${model}!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Tokens: ${data.usage?.total_tokens || "N/A"}`);
      if (data.choices && data.choices.length > 0) {
        console.log(
          `   Response: ${data.choices[0].message.content.substring(0, 100)}...`,
        );
      }
      return { success: true, model };
    } else {
      const errorMsg = data.error?.message || "Unknown error";
      const errorCode = data.error?.code || "unknown_error";
      console.log(`❌ FAILED with ${model}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error Code: ${errorCode}`);
      console.log(`   Message: ${errorMsg.substring(0, 80)}`);
      return { success: false, model, error: errorCode };
    }
  } catch (error) {
    console.log(`❌ EXCEPTION with ${model}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, model, error: error.message };
  }
};

const testAllModels = async () => {
  console.log("\nTesting Models in Order:\n");

  const results = [];

  for (const model of models) {
    const result = await testModel(model);
    results.push(result);

    // If successful, we found a working model
    if (result.success) {
      console.log(
        "\n" +
          "═══════════════════════════════════════════════════════════════",
      );
      console.log(`\n✅ WORKING MODEL FOUND: ${model}\n`);
      console.log("You can now use this model for your app:");
      console.log(`  model: "${model}"`);
      console.log("\nUpdate your code to use this model.");
      return result;
    }
  }

  console.log(
    "\n" + "═══════════════════════════════════════════════════════════════",
  );
  console.log("\n📊 SUMMARY OF ALL MODELS:\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log("✅ WORKING MODELS:");
    successful.forEach((r) => console.log(`   • ${r.model}`));
  } else {
    console.log("❌ NO WORKING MODELS FOUND");
    console.log("\nFailed Models:");
    failed.forEach((r) => {
      console.log(`   • ${r.model}: ${r.error}`);
    });
  }

  return results;
};

// Run the test
testAllModels();
