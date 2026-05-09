/**
 * index.ts
 * Main entry point for the API server.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 1. INITIALIZE ENVIRONMENT IMMEDIATELY
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from backend root or workspace root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

console.log("✅ Environment Variables Loaded");

// 2. NOW IMPORT THE REST OF THE APP
// We use dynamic imports to ensure the environment is ready before these modules load
const { default: app } = await import("./app.js");
const { logger } = await import("./lib/logger.js");
const { seedCatalog } = await import("./seed.js");

const rawPort = process.env["PORT"] ?? "8080";

async function main() {
  try {
    await seedCatalog();
    logger.info("Database seeding checked.");
  } catch (err) {
    // We don't want to crash the whole app if seeding fails
    console.error("Failed to seed catalog:", err);
  }

  app.listen(Number(rawPort), () => {
    console.log(`🚀 Server listening on port ${rawPort}`);
  });
}

main().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});
