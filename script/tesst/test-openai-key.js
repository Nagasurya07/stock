// Test OpenAI API Key
const apiKey = process.env.OPENAI_API_KEY || "your-openai-api-key-here";
const apiBase = "https://api.openai.com/v1";

console.log("🤖 TESTING OPENAI API KEY\n");
console.log("═══════════════════════════════════════════════════════════════");
console.log(
  "API Key: " +
    apiKey.substring(0, 20) +
    "..." +
    apiKey.substring(apiKey.length - 10),
);
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const testOpenAI = async () => {
  try {
    console.log("📊 Testing OpenAI API Connection...\n");

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content:
              "You are a stock market analyst. Provide a brief analysis of the current Indian stock market in one sentence.",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("Response Status: " + response.status);
    console.log("Response Headers:", {
      "Content-Type": response.headers.get("content-type"),
      "RateLimit-Limit-Requests":
        response.headers.get("openai-organization") || "N/A",
    });
    console.log("");

    if (response.ok) {
      console.log("✅ OpenAI API Key is WORKING!\n");
      console.log(
        "═══════════════════════════════════════════════════════════════",
      );
      console.log("\n📝 API Response:\n");

      if (data.choices && data.choices.length > 0) {
        console.log("Model:", data.model || "N/A");
        console.log("Tokens Used:");
        console.log("  - Prompt: " + (data.usage?.prompt_tokens || "N/A"));
        console.log(
          "  - Completion: " + (data.usage?.completion_tokens || "N/A"),
        );
        console.log("  - Total: " + (data.usage?.total_tokens || "N/A"));
        console.log("");
        console.log("Response:");
        console.log(data.choices[0].message.content);
      }

      console.log(
        "\n" +
          "═══════════════════════════════════════════════════════════════",
      );
      console.log("\n✅ OpenAI API is fully functional!");
      console.log("\nYou can now use OpenAI for:");
      console.log("  • Stock analysis and insights");
      console.log("  • Market trend predictions");
      console.log("  • Investment recommendations");
      console.log("  • Financial news summarization");
      console.log("  • Q&A about stocks and markets");

      return true;
    } else {
      console.log("❌ OpenAI API Error:\n");
      console.log("Status: " + response.status + " " + response.statusText);
      console.log("Error Details:");
      console.log(JSON.stringify(data, null, 2));

      if (data.error) {
        console.log("\nError Type: " + data.error.type);
        console.log("Error Message: " + data.error.message);
      }

      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("fetch")) {
      console.log("\nNote: Make sure you have an internet connection.");
    }
    return false;
  }
};

// Run the test
testOpenAI();
