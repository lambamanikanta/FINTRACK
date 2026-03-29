# Docker & cloud MongoDB (Atlas)

## Why not MongoDB in Docker?

Data is stored in **MongoDB Atlas** (or any hosted MongoDB) so it is **durable and reachable from anywhere**. The API container only needs the connection string in `MONGODB_URI`.

## 1. Create an Atlas cluster

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → create a free cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP: `0.0.0.0/0` (testing) or your server’s IP (production).
4. **Database** → **Connect** → **Drivers** → copy the connection string.
5. Replace `<password>` with your user password and set the database name (e.g. `expense-tracker`).

Example (database name `fintrack`):

`mongodb+srv://myuser:MY_SECRET_PASS@cluster0.abcd.mongodb.net/fintrack?retryWrites=true&w=majority`

Use the **exact** connection string from Atlas (Connect → Drivers); only ensure the path before `?` ends with `/fintrack` if that is your target database name.

## 2. Configure environment

From the project root (where `docker-compose.yml` is):

```bash
copy .env.example .env
```

Edit `.env` and set **either**:

**A)** `MONGODB_URI` — full `mongodb+srv://...` string from Atlas → Connect → Drivers, or  

**B)** `ATLAS_CLUSTER_HOST` (e.g. `cluster0.abc123.mongodb.net` only) plus `ATLAS_DB_USER`, `ATLAS_DB_PASSWORD`, `ATLAS_DB_NAME` — the API builds the URI (same as `backend/.env` for `npm run dev`).

Also set `JWT_SECRET`, and `CORS_ORIGIN` (e.g. `http://localhost` for Docker on port 80).

For **local dev without Docker**, use `backend/.env` with the same variables.

## 3. Build and run

From the repo root (where `docker-compose.yml` lives):

```bash
docker compose up --build -d
```

Stack:

| Service | Image | Ports | Role |
|--------|--------|-------|------|
| **api** | `backend/Dockerfile` | `5000` → host | Express API, MongoDB via Atlas |
| **web** | `frontend/Dockerfile` (Vite build + nginx) | `80` → host | Static SPA; proxies `/api`, `/health`, `/uploads` to **api** |

- **App:** [http://localhost](http://localhost) (port **80**) — use this in the browser.  
- **API direct (optional):** [http://localhost:5000](http://localhost:5000) — health: `/health`.

With **`VITE_API_URL` empty** (default), the SPA calls **`/api/...`** on the same origin; **nginx** forwards to `http://api:5000`. Profile uploads go through **`/uploads`** to the same API.

Data:

- **MongoDB:** Atlas (connection from `.env`).  
- **Avatar files:** Docker volume **`fintrack_uploads`** → `/app/uploads` in the API container.

## 4. Deploy to a cloud VM (typical)

1. Install Docker on the server (Ubuntu: `apt install docker.io docker-compose-plugin`).
2. Clone the repo, add `.env` with Atlas URI, `JWT_SECRET`, and `CORS_ORIGIN=https://your-domain.com`.
3. Put TLS in front (e.g. Caddy or nginx on the host) that proxies to `127.0.0.1:80`, or change compose to publish `443` with your own certs.

## 5. Deploy API and frontend separately (optional)

- **API:** Build `backend/Dockerfile`, run with `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` pointing at your frontend URL. Expose port `5000` (or behind a load balancer).
- **Frontend:** Build `frontend/Dockerfile` with a **build arg** `VITE_API_URL=https://api.your-domain.com` so the SPA calls your public API URL directly (no nginx proxy in that image). Serve the image with any static host or CDN.

## 6. Stop

```bash
docker compose down
```

To remove volumes (including uploads):

```bash
docker compose down -v
```
