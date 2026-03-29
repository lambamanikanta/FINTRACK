import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const port = Number(process.env.PORT) || 5000;
/** Bind all interfaces so Docker / reverse proxies can reach the API. */
const host = process.env.HOST || "0.0.0.0";

async function main() {
  await connectDB();
  app.listen(port, host, () => {
    console.log(`API listening on http://${host}:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
