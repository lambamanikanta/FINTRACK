import mongoose from "mongoose";

const LOCAL_FALLBACK = "mongodb://127.0.0.1:27017/fintrack";

/**
 * 1) MONGODB_URI — full string from Atlas → Connect → Drivers (best for Docker)
 * 2) ATLAS_CLUSTER_HOST + ATLAS_DB_USER + ATLAS_DB_PASSWORD — global Atlas without pasting the full URL
 * 3) Local dev fallback: mongodb://127.0.0.1:27017/fintrack (only when NODE_ENV !== production)
 */
function resolveMongoUri() {
  const direct = (process.env.MONGODB_URI || "").trim();
  if (direct) return { uri: direct, source: "MONGODB_URI" };

  const host = (process.env.ATLAS_CLUSTER_HOST || "").trim();
  const user = (process.env.ATLAS_DB_USER || "").trim();
  const pass = (process.env.ATLAS_DB_PASSWORD || "").trim();
  const db = (process.env.ATLAS_DB_NAME || "fintrack").trim();

  if (host && user && pass) {
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(pass);
    const uri = `mongodb+srv://${u}:${p}@${host}/${db}?retryWrites=true&w=majority`;
    return { uri, source: "ATLAS_*" };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Database not configured. Set MONGODB_URI or ATLAS_CLUSTER_HOST + ATLAS_DB_USER + ATLAS_DB_PASSWORD in .env (see backend/.env.example)"
    );
  }

  console.info(`[db] No Atlas/local URI — using dev fallback: ${LOCAL_FALLBACK}`);
  return { uri: LOCAL_FALLBACK, source: "local-dev-fallback" };
}

export async function connectDB() {
  const { uri, source } = resolveMongoUri();
  if (source === "ATLAS_*") {
    console.info("[db] Connecting to MongoDB Atlas (global)");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}
