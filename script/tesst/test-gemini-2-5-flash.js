// Test Gemini 2.5 Flash API
const apiKey = "AIzaSyC5ppCM0i7f2LWIN_4Ne2RnDNuE5k8lkKg";
const model = "gemini-2.5-flash";
const apiBase = "https://generativelanguage.googleapis.com/v1beta";

console.log("🤖 TESTING GEMINI 2.5 FLASH API\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const testGemini = async () => {
  try {
    console.log("📊 Model: " + model);
    console.log("📝 Prompt: Analyze the Indian stock market trends\n");

    const response = await fetch(
      `${apiBase}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Provide a brief analysis of current Indian stock market trends based on the NIFTY 50 index.",
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS! Model generated content:\n");

      if (data.candidates && data.candidates[0]) {
        const content = data.candidates[0].content.parts[0].text;
        console.log("Response:\n" + content);

        console.log(
          "\n═══════════════════════════════════════════════════════════════\n",
        );
        console.log("✅ Gemini API is WORKING!");
        console.log("✅ Model: " + model + " is ready for stock analysis");
        console.log(
          "✅ You can now integrate this into your React Native app\n",
        );
      }
    } else {
      console.log("❌ Error: " + response.status + "\n");
      console.log("Details:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

testGemini();
