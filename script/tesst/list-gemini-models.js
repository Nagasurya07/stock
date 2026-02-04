// List Available Gemini Models
const apiKey = "AIzaSyC5ppCM0i7f2LWIN_4Ne2RnDNuE5k8lkKg";
const apiBase = "https://generativelanguage.googleapis.com/v1beta";

console.log("🔮 LISTING AVAILABLE GEMINI MODELS\n");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const listModels = async () => {
  try {
    console.log("📊 Fetching available models...\n");

    const response = await fetch(`${apiBase}/models?key=${apiKey}`);
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Successfully retrieved available models!\n");

      if (data.models && data.models.length > 0) {
        console.log("Available Models:\n");

        data.models.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`);
          console.log(`   Display: ${model.displayName}`);
          console.log(`   Description: ${model.description}`);
          if (model.supportedGenerationMethods) {
            console.log(
              `   Methods: ${model.supportedGenerationMethods.join(", ")}`,
            );
          }
          console.log("");
        });

        // Find generateContent models
        const generateContentModels = data.models.filter(
          (m) =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent"),
        );

        console.log(
          "═══════════════════════════════════════════════════════════════\n",
        );
        console.log("✅ Models supporting generateContent:\n");
        generateContentModels.forEach((model) => {
          const modelId = model.name.replace("models/", "");
          console.log(`  • ${modelId}`);
        });

        if (generateContentModels.length > 0) {
          console.log(
            "\nRecommended: Use " +
              generateContentModels[0].name.replace("models/", ""),
          );
        }
      }
    } else {
      console.log("❌ Error fetching models:\n");
      console.log("Status: " + response.status);
      console.log("Details:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

// Run the test
listModels();
