/**
 * Simple API Server for Query Processing
 * Handles query requests from the frontend
 */

import cors from "cors";
import "dotenv/config";
import express from "express";
import { fetchYahooNews } from "../middleware/information.js";
import { processQueryForDisplay } from "../middleware/queryreplicat.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  console.log("Health check requested");
  res.json({
    status: "running",
    message: "Stock Query API Server",
    version: "1.0.0",
  });
});

// Query processing endpoint
app.post("/api/query", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      error: "Query is required and must be a string",
    });
  }

  console.log(`📥 Received query: ${query}`);

  try {
    // Process query using queryreplicat
    const result = await processQueryForDisplay(query);

    console.log(`✅ Query processed: ${result.cards.length} stocks found`);

    return res.json(result);
  } catch (error) {
    console.error("❌ Query processing error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      displayMessage:
        "Sorry, an error occurred while processing your query. Please try again.",
      cards: [],
    });
  }
});

// News endpoint (Yahoo Finance)
app.get("/api/news", async (req, res) => {
  const region = typeof req.query.region === "string" ? req.query.region : "IN";
  const limit = Number.parseInt(req.query.limit, 10) || 20;

  try {
    const news = await fetchYahooNews({ region, limit });
    return res.json({ success: true, news });
  } catch (error) {
    console.error("❌ News fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch news",
    });
  }
});

// Batch query endpoint
app.post("/api/query/batch", async (req, res) => {
  const { queries } = req.body;

  if (!Array.isArray(queries)) {
    return res.status(400).json({
      success: false,
      error: "Queries must be an array",
    });
  }

  console.log(`📥 Received ${queries.length} queries`);

  try {
    const results = [];

    for (const query of queries) {
      const result = await processQueryForDisplay(query);
      results.push(result);
    }

    console.log(`✅ Batch processed: ${results.length} queries`);

    return res.json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error("❌ Batch processing error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Stock Query API Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📍 Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`\n🔗 Endpoints:`);
  console.log(`   GET  /              - Health check`);
  console.log(`   POST /api/query      - Process single query`);
  console.log(`   POST /api/query/batch - Process multiple queries`);
  console.log(`\n✅ Ready to accept requests!\n`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("❌ Server error:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

export default app;
