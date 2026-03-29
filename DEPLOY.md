# Deploy: Vercel (frontend) + Render (backend)

Deploy **backend first**, then **frontend**, so you have a public API URL for `VITE_API_URL`.

**Prerequisites:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster, database user, and **Network Access** allowing connections (e.g. `0.0.0.0/0` for testing).

---

## 1. Backend on Render

### Option A — Blueprint (`render.yaml`)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect GitHub → select repo **FINTRACK** → branch `main`.
3. Render reads `render.yaml`. For variables marked `sync: false`, enter values when prompted (or add later under **Environment**).

### Option B — Manual Web Service

1. **New** → **Web Service** → connect the repo (`lambamanikanta/FINTRACK`, branch `main`).
2. **Language / runtime:** choose **Node** — not **Docker**.
   - If you pick **Docker**, Render expects a `Dockerfile` at the **repository root** (or you must set **Root Directory** to `backend` and **Dockerfile Path** to `Dockerfile`). This repo’s API image is `backend/Dockerfile`; the simplest path is **Node + `backend` root** (see below).
3. **Root Directory:** `backend` (required — the API lives in a subfolder, not the repo root).
4. **Build Command:** `npm ci --omit=dev` (or `npm install`)
5. **Start Command:** `npm start`
6. **Health Check Path:** `/health`

After creation, open the service → **Settings** → confirm **Root Directory** is `backend` if builds fail looking for `package.json` at the repo root.

### Environment variables (Render)

| Key | Example / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` (already in `render.yaml`) |
| `PORT` | Set automatically by Render — do not override unless you know why |
| `JWT_SECRET` | Long random string |
| `CORS_ORIGIN` | Frontend URL(s), e.g. `https://fintrack.vercel.app` (no trailing slash). For multiple sites, comma-separate values. |
| **Database** | **Either** `MONGODB_URI` (full Atlas string) **or** `ATLAS_CLUSTER_HOST` + `ATLAS_DB_USER` + `ATLAS_DB_PASSWORD` + `ATLAS_DB_NAME` |

After deploy, copy the service URL, e.g. `https://fintrack-api.onrender.com`.

**Note:** Free web services **sleep** after idle time; first request can take ~30–60s. Avatar uploads use the instance filesystem unless you add a **persistent disk** on Render.

---

## 2. Frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import the **same** GitHub repo.
2. **Root Directory:** `frontend` (important for this monorepo).
3. **Framework Preset:** Vite (auto-detected).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** `dist` (default).

### Environment variable (Vercel)

| Key | Value |
| --- | --- |
| `VITE_API_URL` | Your Render API base URL **without** trailing slash, e.g. `https://fintrack-api.onrender.com` |

`VITE_*` is baked in at **build time**. After changing `VITE_API_URL`, trigger **Redeploy** in Vercel.

### `CORS_ORIGIN` on Render

Set `CORS_ORIGIN` on Render to match how users open the app:

- Production: `https://your-project.vercel.app` **or** `https://your-site.netlify.app`
- Preview deployments: either use the production frontend URL only, or add multiple origins (your app currently supports a **single** `CORS_ORIGIN` — use your main production URL for simplicity).

---

## 2b. Frontend on Netlify (alternative to Vercel)

1. [Netlify](https://www.netlify.com) → **Add new site** → **Import an existing project** → GitHub → repo **FINTRACK**.
2. **Build settings:** Either leave **Build command** / **Publish directory** empty so Netlify uses the repo **`netlify.toml` at the root**, or set manually:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build` (never `npm run dev`)
   - **Publish directory:** `dist` (if base is `frontend`) **or** `frontend/dist` from repo root — match what **`netlify.toml`** uses after you push it.
3. The repository includes **`/netlify.toml`** (root) and **`frontend/netlify.toml`** — push both; the root file pins **`npm run build`** and **`frontend/dist`** so deploys don’t run the Vite dev server.

### Environment variable (Netlify)

**Site configuration** → **Environment variables** → add:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | Your Render API URL **without** trailing slash, e.g. `https://fintrack-api.onrender.com` |

Redeploy after changing env vars (`VITE_*` is applied at **build time**).

### “Page not found” on `/login`, `/dashboard`, etc.

This is a **SPA routing** issue: Netlify must serve `index.html` for all paths. This repo includes:

- **`frontend/netlify.toml`** — redirect `/*` → `/index.html` with status 200  
- **`frontend/public/_redirects`** — same rule (copied into `dist` by Vite)

Push these files and trigger **Clear cache and deploy site** if 404s persist.

### Build stuck / “taking a long time” / log shows `vite` on port 5173

Netlify must **not** run `npm run dev`. The dev server never exits, so the deploy hangs.

1. **Site configuration** → **Build & deploy** → **Build settings**  
   - **Build command:** `npm run build` (production build)  
   - **Publish directory:** `dist`  
2. Remove any override that sets the build command to `npm run dev` or `vite`.  
3. Ensure **`frontend/netlify.toml`** is **committed and pushed** so Netlify picks up `[build] command` and `publish` (log should show “Config file” pointing at `netlify.toml`, not “No config file”).  
4. Redeploy.

---

## 3. Verify

1. Open the frontend URL (Vercel or Netlify) → register / login.
2. If the browser shows CORS errors, ensure `CORS_ORIGIN` on Render includes the frontend origin (scheme + host, no path). Use comma-separated values when more than one frontend URL is used.
3. API health: `https://YOUR-RENDER-URL/health` should return JSON `{ "ok": true }`.

---

## Files in this repo

| File | Role |
| --- | --- |
| `render.yaml` | Render Blueprint for the API |
| `frontend/vercel.json` | Vercel: Vite build + SPA rewrites |
| `netlify.toml` (repo root) | Netlify: monorepo base `frontend`, `npm run build`, publish `frontend/dist` |
| `frontend/netlify.toml` | Netlify (alt): build + SPA redirects when base is `frontend` only |
| `frontend/public/_redirects` | Netlify: SPA fallback (copied to `dist`) |
