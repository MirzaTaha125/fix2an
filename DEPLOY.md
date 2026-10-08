# Fixa2an – DigitalOcean Deployment

**GitHub:** https://github.com/MirzaTaha125/fix2an  
**Spec file:** `.do/app.yaml` (App Platform: API + Frontend)

Monorepo = **2 components**: Backend (`api`) + Frontend (static site).

---

## Option A — App Platform (recommended)

Closest to Railway: GitHub push pe auto-deploy, managed SSL, no server SSH.

### 1. Prerequisites

1. [DigitalOcean](https://cloud.digitalocean.com) account
2. GitHub repo connect: **Apps** → authorize DigitalOcean for `MirzaTaha125/fix2an`
3. MongoDB Atlas cluster ready (Network Access: `0.0.0.0/0`)
4. Latest code **pushed to `main`** (including `.do/app.yaml`)

### 2. Create the app (Control Panel)

1. [Create App](https://cloud.digitalocean.com/apps) → **GitHub** → `MirzaTaha125/fix2an` → branch `main`
2. DO detect karega; manually set:

| Component | Type | Source directory | Build | Run / Output |
|-----------|------|------------------|-------|----------------|
| **api** | Web Service | `Backend` | (auto `npm install`) | `npm start` |
| **frontend** | Static Site | `Frontend` | `npm ci && npm run build` | Output dir: `dist` |

3. Frontend static site:
   - **Index document:** `index.html`
   - **Catchall document:** `index.html` (React Router ke liye zaroori)
4. Region: **Frankfurt (FRA)** ya Amsterdam (Sweden ke qareeb)
5. Plan: **Basic** / smallest (`basic-xxs`) start ke liye theek hai

Ya CLI se:

```bash
# Install: https://docs.digitalocean.com/reference/doctl/how-to/install/
doctl auth init
doctl apps create --spec .do/app.yaml
```

Secrets baad mein UI se set karo (neeche).

### 3. Environment variables

#### Backend (`api`) — Runtime

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Atlas connection string (password filled in) |
| `JWT_SECRET` | Random 32+ char secret |
| `FRONTEND_URL` | Frontend public URL (e.g. `https://fixa2an-xxxxx.ondigitalocean.app`) — ya `${frontend.PUBLIC_URL}` binding |
| `COMMISSION_RATE` | `0.1` (optional) |
| `NODE_ENV` | `production` |

`PORT` App Platform khud set karti hai — `server.js` already use karta hai.

#### Frontend — **Build-time** (Vite)

| Key | Scope | Value |
|-----|--------|--------|
| `VITE_API_URL` | Build | Backend public URL **bina trailing slash** (e.g. `https://fixa2an-api-xxxxx.ondigitalocean.app`) |
| `VITE_FRONTEND_URL` | Build | Frontend public URL |
| `VITE_CAR_IMAGES_API_KEY` | Build | Optional |

**Important:** `VITE_*` sirf **build** pe inject hote hain. Backend URL change ho to frontend **Force Rebuild / Redeploy**.

### 4. Deploy order

1. Backend deploy → **Live URL** copy (Settings → Domains)
2. Frontend pe `VITE_API_URL` = backend URL → Rebuild
3. Frontend URL copy → Backend `FRONTEND_URL` set → Backend redeploy (CORS)

### 5. Custom domain (optional)

App → **Settings** → **Domains** → Add `fixa2an.se` / `api.fixa2an.se`  
DNS pe DO jo CNAME/A records dikhaye, wahi lagao.  
Phir `FRONTEND_URL` aur `VITE_API_URL` / `VITE_FRONTEND_URL` update karke **frontend rebuild**.

### 6. MongoDB Atlas

- Cluster → Connect → Drivers → connection string
- Database user + password
- Network Access → `0.0.0.0/0` (App Platform IPs change hote rehte hain)

### 7. Admin & email

```bash
cd Backend
# Locally with production MONGODB_URI:
MONGODB_URI="mongodb+srv://..." npm run create-admin
```

Email: Admin Panel → Settings → SMTP / EmailJS (DB mein store).

### 8. Uploads note

App Platform filesystem **ephemeral** hai — redeploy pe `/uploads` files lose ho sakti hain.  
Production ke liye baad mein DigitalOcean **Spaces** (S3-compatible) lagana behtar hai.

### 9. Health check

Backend: `GET https://YOUR-API-URL/health` → `{ ok: true }`

---

## Option B — Droplet (VPS / Nginx)

Zyada control chahiye ho to:

1. Ubuntu Droplet (e.g. 1GB FRA)
2. Node 20 + Nginx + PM2
3. Backend: `pm2 start Backend/src/server.js --name fixa2an-api`
4. Frontend: `npm run build` → Nginx `root` = `Frontend/dist`, SPA fallback `try_files $uri /index.html`
5. Certbot for HTTPS
6. Env files on server: `Backend/.env`, build-time `VITE_API_URL`

App Platform se zyada setup; pehle Option A try karo.

---

## Railway (previous)

Pehle Railway pe 2 services (`Backend` / `Frontend` root dirs) — details purani guide jaisi: root dir + `MONGODB_URI` / `VITE_API_URL`. Ab primary target DigitalOcean App Platform hai.
