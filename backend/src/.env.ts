/**
 * src/env.ts
 * This module initializes environment variables immediately upon import.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We check multiple levels to accommodate different workspace structures
// 1. Check three levels up (Workspace Root)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// 2. Check one level up (Backend Root)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 3. Check current directory
dotenv.config();

console.log("🛠️  Environment initialized");
