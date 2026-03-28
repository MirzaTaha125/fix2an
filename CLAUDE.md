# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fixa2an** is a vehicle repair marketplace platform connecting customers with workshops in Sweden. Customers upload inspection reports, receive quotes from workshops, and book appointments.

**User roles:** CUSTOMER, WORKSHOP, ADMIN

## Development Commands

### Frontend (React + Vite, port 5173)
```bash
cd Frontend
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend (Express, port 4000)
```bash
cd Backend
npm install
npm run dev       # Dev mode with auto-reload (node --watch)
npm run start     # Production start
npm run create-admin  # Create initial admin user
```

### Running Both
Open two terminals — one for Frontend, one for Backend.

## Environment Variables

**Backend `.env`:**
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Token signing secret
- `COMMISSION_RATE` — Platform commission (e.g. `0.1` for 10%)
- `FRONTEND_URL` — Frontend origin for CORS and email links (e.g. `http://localhost:5173`)

**Frontend `.env`:**
- `VITE_API_URL` — Backend base URL (e.g. `http://localhost:4000/`)
- `VITE_FRONTEND_URL` — Frontend public URL

## Architecture

### Frontend (`Frontend/src/`)
- **React 18 + Vite**, styled with **Tailwind CSS**
- **React Router v6** for client-side routing
- **i18next** for EN/SV internationalization (translation files in `src/locales/`)
- **Axios** instance at `src/config/api.js` — auto-injects JWT from localStorage, 30s timeout
- **Framer Motion** for animations, **Lucide React** icons, **React Hot Toast** notifications

### Backend (`Backend/src/`)
- **Express** server on port 4000, all routes prefixed `/api/`
- **MongoDB** via **Mongoose** (Atlas cloud)
- **JWT** authentication, **bcryptjs** password hashing
- **Multer** for file uploads (served at `/uploads`)
- **Nodemailer / EmailJS** for email notifications (config stored in DB via `EmailConfig` model)
- **Speakeasy** for 2FA TOTP

### API Routes
| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Login, register, 2FA, email verification |
| `/api/vehicles` | Customer vehicle management |
| `/api/requests` | Service requests (customer → workshops) |
| `/api/offers` | Repair quotes (workshop → customer) |
| `/api/bookings` | Appointment bookings |
| `/api/reviews` | Workshop reviews/ratings |
| `/api/workshop` | Workshop profile management |
| `/api/admin` | Admin dashboard, approvals, stats |
| `/api/upload` | File/document uploads |

### Database Models
- **User** — CUSTOMER/WORKSHOP/ADMIN roles, 2FA support, geo-location
- **Request** — Service requests with vehicle info and inspection docs
- **Offer** — Workshop quotes (ACTIVE/ACCEPTED/REJECTED/EXPIRED)
- **Booking** — Appointments (PENDING/CONFIRMED/DONE/CANCELLED/RESCHEDULED)
- **Workshop** — Workshop profiles (PENDING/APPROVED/REJECTED)
- **Vehicle** — Customer vehicle records
- **Review** — Post-booking ratings (1–5 stars)
- **Wallet / WalletTransaction** — Commission tracking
- **EmailConfig** — Email provider settings (SMTP or EmailJS)

### Vite Proxy
The dev proxy in `Frontend/vite.config.js` currently points to the Railway production backend. Switch the commented target to `http://localhost:4000/` for local full-stack development.

## Deployment

Deployed on **Railway** (monorepo). See `DEPLOY.md` for full Railway setup. Frontend also hosted on Hostinger. Database on **MongoDB Atlas**.

## Key Design Notes

- UI styling conventions are documented in `UI_STYLING_REFERENCE.md`
- Mobile UI reference and optimization plan in `MOBILE_REFERENCE_PLAN.md`
- Email can be configured via Admin Panel (either SMTP or EmailJS — see `EMAILJS_SETUP.md`)
