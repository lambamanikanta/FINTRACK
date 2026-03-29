# FINTRACK

Personal finance web app: **React (Vite)** frontend and **Node.js (Express)** backend, with **MongoDB Atlas** (or local MongoDB) for data.

Live app: [https://fintrackmani.netlify.app](https://fintrackmani.netlify.app)

## Features

- Authentication (register / login, JWT) and protected routes
- Transactions, analytics, loans, and settings
- Optional profile avatar uploads (stored under the API `uploads/` path)
- **Docker:** SPA + API behind nginx, or run `backend` / `frontend` separately for local development

## Tech stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19, Vite, React Router, Recharts     |
| Backend  | Express, Mongoose, JWT, bcrypt, multer       |
| Database | MongoDB (Atlas recommended)                |

## Project structure

```text
expense-tracker/
├── .env.example              # Docker / deploy env template (repository root)
├── .gitignore
├── docker-compose.yml        # API + web (nginx + SPA) for local Docker
├── DOCKER.md                 # Docker + MongoDB Atlas notes
├── DEPLOY.md                 # Vercel + Render deployment guide
├── netlify.toml              # Netlify monorepo build (root; do not use npm run dev)
├── render.yaml               # Render Blueprint (backend API)
├── README.md
│
├── backend/                  # Node.js + Express API
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js             # Entry point
│   ├── app.js                # Express app, CORS, static /uploads, routes
│   ├── config/
│   │   └── db.js             # MongoDB connection (Atlas or local fallback)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── loanController.js
│   │   ├── profileController.js
│   │   └── transactionController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── avatarUpload.js
│   │   └── validateRequest.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Loan.js
│   └── routes/
│       ├── authRoutes.js
│       ├── transactionRoutes.js
│       └── loanRoutes.js
│
└── frontend/                 # React + Vite SPA
    ├── .dockerignore
    ├── Dockerfile            # Production: Vite build + nginx
    ├── vercel.json           # Vercel: Vite build + SPA rewrites
    ├── netlify.toml          # Netlify: build + SPA redirects
    ├── nginx.conf            # Proxies /api, /health, /uploads to API (Docker)
    ├── index.html
    ├── package.json
    ├── vite.config.js        # Dev proxy to backend :5000
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/
        ├── context/          # AuthContext, CurrencyContext
        ├── pages/
        ├── services/
        │   └── api.js        # fetch, JWT, API helpers
        └── utils/
```

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- MongoDB running locally, or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`: set `MONGODB_URI` **or** `ATLAS_CLUSTER_HOST` + `ATLAS_DB_*`, plus `JWT_SECRET` and `CORS_ORIGIN` (e.g. `http://localhost:5173` for Vite).

```bash
npm install
npm run dev
```

API listens on **http://localhost:5000** (health: `GET /health`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173** — Vite proxies `/api`, `/health`, and `/uploads` to the backend (`vite.config.js`).

## Docker (full stack locally)

From the **repository root**:

```bash
cp .env.example .env
```

Set Atlas credentials or `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN=http://localhost` (browser uses port 80).

```bash
docker compose up --build -d
```

Open **http://localhost** (nginx on port 80; `/api` is forwarded to the API container). See **[DOCKER.md](./DOCKER.md)** for details.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `MONGODB_URI` | Full MongoDB URI (if set, overrides `ATLAS_*` construction) |
| `ATLAS_CLUSTER_HOST` | Atlas hostname only (e.g. `cluster0.xxxxx.mongodb.net`) |
| `ATLAS_DB_USER` / `ATLAS_DB_PASSWORD` / `ATLAS_DB_NAME` | Used with `ATLAS_CLUSTER_HOST` to build `mongodb+srv://…` |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed browser origin(s); for multiple frontends, use comma-separated URLs |
| `VITE_API_URL` | Frontend build-time API base URL; leave empty for same-origin `/api` (Docker nginx) |

Do **not** commit real `.env` files; only commit `.env.example` templates.

## Deploy (Vercel + Render)

Step-by-step instructions, env vars, and troubleshooting: **[DEPLOY.md](./DEPLOY.md)**.

**Summary:** Deploy the **Render** API first → copy its public URL → deploy the **frontend** on **Vercel** or **Netlify** with **base/root directory** `frontend`, set **`VITE_API_URL`** to the Render URL (no trailing slash). On Render, set **`CORS_ORIGIN`** to your exact frontend URL (e.g. `https://….netlify.app`). Netlify SPA routing: **`frontend/netlify.toml`** and **`frontend/public/_redirects`**. This repo includes **`render.yaml`**, **`frontend/vercel.json`**, and Netlify files.

## API overview

| Area | Base path |
| ---- | --------- |
| Auth | `/api/auth` |
| Transactions | `/api/transactions` |
| Loans | `/api/loans` |
| Static uploads | `/uploads/...` |

## License

Add a `LICENSE` file if you open-source the repository.
