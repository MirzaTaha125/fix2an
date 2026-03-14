# Fixa2an – Railway Deployment Guide

**GitHub:** https://github.com/MirzaTaha125/fix2an

---

## Railway Deployment

Monorepo hai – **2 services** banana: Backend + Frontend.

### 1. Backend Service

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo** → `MirzaTaha125/fix2an` select
2. **Settings** → **Root Directory:** `Backend`
3. **Build Command:** (default) `npm install`
4. **Start Command:** `npm start`
5. **Variables:**
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – koi random secure string (e.g. 32 chars)
   - `FRONTEND_URL` – Frontend ka public URL (e.g. `https://fix2an-frontend.up.railway.app`)
6. **Settings** → **Networking** → **Generate Domain** – ye URL `FRONTEND_URL` mein use karega
7. Backend `PORT` Railway auto set karta hai – `server.js` already use karta hai

---

### 2. Frontend Service

1. Same project → **+ New** → **GitHub Repo** → same `fix2an` repo
2. **Settings** → **Root Directory:** `Frontend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start` (ye `npx serve dist -s -l 3000` run karega)
5. **Variables:**
   - `VITE_API_URL` – Backend ka public URL (e.g. `https://fix2an-backend.up.railway.app`)
   - **Important:** Vite build time pe `VITE_*` vars inject karta hai, isliye redeploy karna padega agar backend URL badle
6. **Networking** → **Generate Domain**

---

### 3. Deploy Order

1. **Backend** pehle deploy karo → Domain generate → URL copy
2. **Frontend** deploy karo with `VITE_API_URL` = Backend URL
3. Frontend domain generate → URL copy
4. Backend ke **Variables** mein `FRONTEND_URL` = Frontend URL daal ke redeploy

---

### 4. MongoDB Atlas

- [MongoDB Atlas](https://cloud.mongodb.com) pe cluster banao
- **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere)
- **Database** → Create user → Connection string copy
- `MONGODB_URI` Railway variable mein paste (replace `<password>` with actual password)

---

### 5. Admin & Email

- Admin create: Backend locally run karke `npm run create-admin` chalao, ya ek seed script add karo
- Email: Admin Panel → Settings → SMTP configure (DB pe store hota hai)
