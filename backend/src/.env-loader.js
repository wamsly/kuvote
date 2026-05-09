/**
 * env-loader.ts
 * This file ensures environment variables are loaded during the ESM import phase.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We check multiple potential locations for the .env file
// 1. Root of the workspace
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
// 2. Root of the backend package
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// 3. Current directory
dotenv.config();

console.log("✅ Environment initialized");