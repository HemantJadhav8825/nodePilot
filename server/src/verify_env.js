import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

if (process.env.GITHUB_SECRET) {
  console.log("SUCCESS: GITHUB_SECRET is loaded.");
} else {
  console.log("FAILURE: GITHUB_SECRET is not defined.");
  process.exit(1);
}
