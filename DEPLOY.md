# Fixa2an – Railway Deployment Guide

## GitHub Push

```bash
git init
git add .
git commit -m "Initial commit - Fixa2an"
git branch -M main
git remote add origin https://github.com/MirzaTaha125/fix2an.git
git push -u origin main
```

---

## Railway Deployment

Railway par **2 services** banana: Backend + Frontend (monorepo).

### 1. Backend Service

1. **New Project** → **Deploy from GitHub** → select `fix2an` repo
2. **Root Directory:** `Backend` (set in Service Settings)
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables:**

   | Variable        | Value                    |
   |-----------------|--------------------------|
   | `MONGODB_URI`   | Your MongoDB Atlas URI   |
   | `JWT_SECRET`    | Random secure string     |
   | `FRONTEND_URL`  | `https://your-frontend.railway.app` (Frontend deploy ke baad) |
   | `PORT`          | Railway auto-assigns, optional |

6. **Port:** Railway uses `PORT` env var; backend ko `process.env.PORT` use karna chahiye.

---

### 2. Frontend Service

1. Same project mein **+ New** → **GitHub Repo** (same `fix2an` repo)
2. **Root Directory:** `Frontend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** Serve static build (Nginx/`serve` ya static hosting)
5. **Environment Variables:**

   | Variable        | Value                          |
   |-----------------|--------------------------------|
   | `VITE_API_URL`  | `https://your-backend.railway.app` |

**Frontend static hosting:** Railway pe Vite build ko serve karne ke liye:
- `npx serve dist -s -l 3000` (install `serve` as devDep ya use `npx`).
- Ya Frontend ke `package.json` mein add:  
  `"start": "vite preview --port 3000 --host"`  
  (ye built files serve karega).

**Better approach:** `package.json` mein:
```json
"scripts": {
  "build": "vite build",
  "start": "npx serve dist -s -l $PORT"
}
```
`serve` package add karo: `npm install -g serve` ya `npm i -D serve`.

---

### 3. Backend CORS

Backend `server.js` mein CORS allow karo Frontend origin:

```js
cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true })
```

---

### 4. MongoDB Atlas

- MongoDB Atlas pe cluster banao
- Network Access: `0.0.0.0/0` (ya Railway IPs) add karo
- Database User banao, connection string copy karo
- `MONGODB_URI` env var mein daalo

---

### 5. Order of Deploy

1. Pehle **Backend** deploy karo → uska URL lo (e.g. `https://fix2an-backend.railway.app`)
2. Backend mein `FRONTEND_URL` = Frontend ka URL (temporary localhost pehle)
3. **Frontend** deploy karo with `VITE_API_URL` = Backend URL
4. Frontend ka URL lo → Backend ke `FRONTEND_URL` mein update karo
