/**
 * Test script to send query to API server
 */

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
    "Content-Length": data.length,
  },
};

console.log("📤 Sending query...");
console.log("Query:", query);
console.log("");

const req = http.request(options, (res) => {
  let responseData = "";

  console.log(`📥 Response Status: ${res.statusCode}`);

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(responseData);
      console.log("");
      console.log("✅ Response received:");
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (e) {
      console.log("Raw Response:", responseData);
      process.exit(1);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});

req.write(data);
req.end();
