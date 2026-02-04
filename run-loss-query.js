import http from "http";

const query = "10 stocks in losses";
const data = JSON.stringify({ query });

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/query",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

console.log("Connecting to API...");

const req = http.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(responseData);

      // Extract stock cards
      if (result.success && result.cards && result.cards.length > 0) {
        console.log("\n✅ Loss Stocks Found:");
        console.log("================================\n");

        result.cards.forEach((stock, idx) => {
          console.log(`#${stock.rank} ${stock.symbol}`);
          console.log(`Company: ${stock.company}`);
          console.log(`Price: ₹${stock.price}`);
          console.log(`Change: ₹${stock.change}`);
          console.log(`% Change: ${stock.percentChange}`);
          console.log("---");
        });

        console.log(`\n📊 Total: ${result.metadata.totalResults} stocks`);
        console.log(
          `⏱️ Processing time: ${result.metadata.processingTime / 1000}s`,
        );
      } else {
        console.log("No stocks found");
      }
      process.exit(0);
    } catch (e) {
      console.error("Parse error:", e.message);
      console.log("Response:", responseData.substring(0, 500));
      process.exit(1);
    }
  });
});

req.on("error", (e) => {
  console.error("Connection Error:", e.message);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("Request Timeout");
  req.destroy();
  process.exit(1);
});

req.setTimeout(10000);
req.write(data);
req.end();
