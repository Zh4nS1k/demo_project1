# 🚀 Deployment Guide

This project deploys as **two units**:

| Unit | Recommended host | Why |
|------|------------------|-----|
| `client/` (Next.js) | **Vercel** | Zero-config Next.js hosting, free tier |
| `server/` (Express + MongoDB) | **Render** | Long-running Node process, free web service |

The database lives on **MongoDB Atlas** (free M0 tier) — Render/Vercel don't host MongoDB.

> Prefer one platform for everything? Render can also host the client as a Static Site, and Vercel can host the server as a serverless function — but the split above is the best fit for this codebase.

---

## 0. Prerequisites

- GitHub repo with this project pushed
- Accounts: [Vercel](https://vercel.com), [Render](https://render.com), [MongoDB Atlas](https://cloud.mongodb.com)
- A terminal for generating secrets

Generate a JWT secret now, you'll need it twice:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 1. Database — MongoDB Atlas

1. Create a free **M0** cluster (any region close to your users).
2. **Database Access** → add a database user (username + password, keep them safe).
3. **Network Access** → add IP `0.0.0.0/0` (Render/Vercel egress IPs are dynamic).
4. **Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/coffee_drinker
   ```

---

## 2. API — Render

1. Render dashboard → **New → Web Service**.
2. Connect your GitHub repo, then configure:
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
3. **Environment variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas string from step 1 |
   | `JWT_SECRET` | the hex secret you generated |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | `https://<your-app>.vercel.app` (set after step 3, or leave `*` while testing) |

4. Deploy. Render logs the startup banner — look for `✅ MongoDB connected` and `🚀 Coffee Drinker API is running`.
5. Verify: open `https://<your-api>.onrender.com/` — the API JSON health card should respond.

> 💡 Free Render services sleep after 15 min of inactivity; the first request after sleep takes ~30s. The client survives this via its offline queue.

---

## 3. Client — Vercel

1. Vercel dashboard → **Add New → Project** → import the GitHub repo.
2. Configure:
   - **Root Directory**: `client`
   - Framework preset: **Next.js** (auto-detected)
   - Build command / output: leave defaults
3. **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<your-api>.onrender.com` |

   This is used by the Next.js rewrite (`/api/:path*` → backend). Because it's read at request time, the browser only ever talks to the client origin — no CORS pain in the common case.

4. Deploy. You get `https://<your-app>.vercel.app`.
5. **Close the loop**: go back to Render → Environment → set
   `CORS_ORIGIN=https://<your-app>.vercel.app` and redeploy. (Needed only if the API is ever called cross-origin directly.)

---

## 4. Seed data (optional)

Once the API is live, seed demo content from your machine:

```bash
cd server
MONGODB_URI="<your-atlas-uri>" npm run seed
```

Promote your first admin user:

```bash
cd server
MONGODB_URI="<your-atlas-uri>" USER=<username> npm run promote-admin
```

---

## 5. CI/CD — GitHub Actions (already wired)

`.github/workflows/ci.yml` runs on every push/PR:

- ✅ Server tests (62, in-memory MongoDB)
- ✅ Client offline-resilience harness
- ✅ Client production build

Merges to `main` are already verified by pre-push hooks + CI.

---

## 6. Alternative — Docker anywhere

If you'd rather run the whole stack on one box (VPS, Fly.io, Railway, cloud VM):

```bash
cp server/.env.example .env   # then edit: real MONGODB_URI + JWT_SECRET
JWT_SECRET=$(grep JWT_SECRET .env | cut -d= -f2) docker compose up --build -d
```

- Client → `http://localhost:3001`
- API → `http://localhost:3000`
- Mongo data persists in the `mongo-data` volume

Put nginx/Caddy in front for TLS if the box is public.

---

## Troubleshooting 🔧

| Symptom | Fix |
|---------|-----|
| Render deploy fails, `JWT_SECRET is missing` | Add the env var in Render — the server refuses to boot without it (≥16 chars) |
| Client shows "offline" banners | `NEXT_PUBLIC_API_URL` missing/wrong on Vercel, or Render service asleep |
| `429 Too many requests` in prod | Global limiter (300 req/5min/IP). Raise it if you sit behind a shared NAT/proxy |
| Login returns 401 immediately | `JWT_SECRET` differs between deploys — tokens signed elsewhere are rejected |
| Atlas connection timeout | Network Access IP list missing `0.0.0.0/0`, or wrong password (URL-encode special chars!) |
| CORS errors in console | `CORS_ORIGIN` on Render doesn't exactly match your Vercel URL (scheme + host, no trailing slash) |
