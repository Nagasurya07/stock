// Test Google Gemini API Key
const apiKey = "AIzaSyC5ppCM0i7f2LWIN_4Ne2RnDNuE5k8lkKg";
const apiBase = "https://generativelanguage.googleapis.com/v1beta/models";
const model = "gemini-1.5-flash";

console.log("🔮 TESTING GOOGLE GEMINI API KEY\n");
console.log("═══════════════════════════════════════════════════════════════");
console.log(
  "API Key: " +
    apiKey.substring(0, 15) +
    "..." +
    apiKey.substring(apiKey.length - 10),
);
console.log("Model: " + model);
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const testGemini = async () => {
  try {
    console.log("📊 Testing Gemini API Connection...\n");

    const response = await fetch(
      `${apiBase}/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "You are a stock market analyst. Provide a brief analysis of the current Indian stock market in one sentence.",
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    console.log("Response Status: " + response.status);
    console.log("Response Headers:", {
      "Content-Type": response.headers.get("content-type"),
      "X-API-Title": response.headers.get("x-api-title") || "N/A",
    });
    console.log("");

    if (response.ok) {
      console.log("✅ Google Gemini API Key is WORKING!\n");
      console.log(
        "═══════════════════════════════════════════════════════════════",
      );
      console.log("\n📝 API Response:\n");

      if (data.candidates && data.candidates.length > 0) {
        console.log("Model: " + model);
        console.log("Usage Metadata:");
        console.log(
          "  - Input Tokens: " + (data.usageMetadata?.inputTokenCount || "N/A"),
        );
        console.log(
          "  - Output Tokens: " +
            (data.usageMetadata?.outputTokenCount || "N/A"),
        );
        console.log(
          "  - Total Tokens: " +
            (data.usageMetadata?.candidatesTokenCount || "N/A"),
        );
        console.log("");
        console.log("Response:");

        const content = data.candidates[0].content;
        if (content && content.parts && content.parts.length > 0) {
          console.log(content.parts[0].text);
        } else {
          console.log("(No text in response)");
        }
      } else {
        console.log("Response:", JSON.stringify(data, null, 2));
      }

      console.log(
        "\n" +
          "═══════════════════════════════════════════════════════════════",
      );
      console.log("\n✅ Google Gemini API is fully functional!");
      console.log("\nYou can now use Gemini for:");
      console.log("  • Stock analysis and insights");
      console.log("  • Market trend analysis");
      console.log("  • Investment recommendations");
      console.log("  • Financial news summarization");
      console.log("  • Q&A about stocks and markets");
      console.log("  • Completely FREE with generous quotas!");

      return true;
    } else {
      console.log("❌ Gemini API Error:\n");
      console.log("Status: " + response.status + " " + response.statusText);
      console.log("Error Details:");
      console.log(JSON.stringify(data, null, 2));

      if (data.error) {
        console.log("\nError Code: " + data.error.code);
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
testGemini();
