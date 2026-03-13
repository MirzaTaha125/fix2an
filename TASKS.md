# Fixa2an – Task & Gap Tracker

Legend: **✅ Done** | **🔶 Partial** | **⬜ Missing / To do**

---

## 1. Brand & Design

| Item | Status | Gap |
|------|--------|-----|
| Primary blue | 🔶 | Spec: #1C3F94 – current: #05324f. Update to #1C3F94 where needed. |
| Green | ✅ | #34C759 |
| White | ✅ | #FFFFFF |
| Fonts | ⬜ | Use Montserrat / Poppins / Inter (currently likely system/default). |
| i18n for NO/DK/FI | 🔶 | Structure ready; add locales for Norwegian, Danish, Finnish. |

---

## 2. Authentication

| Item | Status | Gap |
|------|--------|-----|
| Email/Password | ✅ | — |
| Magic link login | ⬜ | Magic link flow + email sending. |
| 2FA for Admin | ✅ | TOTP / 2FA setup in Admin Settings; verify step at login. |
| Account verification email | ✅ | 6-digit code by email + verify-email page with OTP boxes. |

---

## 3. Payments (Klarna)

| Item | Status | Gap |
|------|--------|-----|
| Klarna Checkout | ⬜ | Klarna Checkout API integration. |
| Embed Klarna Checkout | ⬜ | Hosted checkout in booking flow. |
| Payment on booking | ⬜ | Book → Klarna → confirm payment flow. |
| Commission allocation | 🔶 | DB fields exist; amounts not coming from Klarna yet. |
| Klarna order creation | ⬜ | Create order + link with booking. |
| klarnaOrderId usage | 🔶 | Field exists; full flow not wired. |

---

## 4. Workshop Payouts

| Item | Status | Gap |
|------|--------|-----|
| Payout from Klarna | ⬜ | Manual based on Klarna dashboard. |
| Payout reports | 🔶 | Admin reports exist; no sync with Klarna. |
| Mark payout as paid | ✅ | Admin UI done. |
| Export CSV | ✅ | — |
| Export PDF | ⬜ | PDF export feature. |

---

## 5. Refunds

| Item | Status | Gap |
|------|--------|-----|
| Refund via Klarna API | ⬜ | Refund endpoint / flow. |
| Refund UI | ⬜ | Admin / customer refund request UI. |

---

## 6. Radius / Geography

| Item | Status | Gap |
|------|--------|-----|
| Workshop radius filter | 🔶 | Offers route uses radius; requests route does not. |
| Verified workshops within radius | 🔶 | Apply same logic across all relevant routes. |

---

## 7. Cancellation & Refund Policy

| Item | Status | Gap |
|------|--------|-----|
| Free cancel ≥24h | 🔶 | Text in UI; logic only partially implemented. |
| Inside 24h: workshop proposals | ⬜ | Reschedule / partial refund flow. |
| Refund via Klarna | ⬜ | Klarna refund API call. |
| Policy enforcement | 🔶 | Add consistent checks and flows. |

---

## 8. Workshop Dashboard

| Item | Status | Gap |
|------|--------|-----|
| Requests / offers / bookings | ✅ | — |
| Payout status (read-only) | 🔶 | Simple reports; no Klarna payout status. |
| Commission reports | 🔶 | Backend / DB ready; no Klarna integration. |

---

## 9. Admin Panel

| Item | Status | Gap |
|------|--------|-----|
| Manage users, workshops, etc. | ✅ | — |
| Approve/deny workshops | ✅ | — |
| Fixa2an Verified badge | 🔶 | Verification exists; badge spec unclear. |
| Commission & payouts dashboard | 🔶 | Basic payouts; not linked to Klarna. |
| Export CSV | ✅ | — |
| Export PDF | ⬜ | — |
| Block workshops | ✅ | — |
| Refund management | ⬜ | Refund request + Klarna refund flow. |
| Email config (SMTP in DB) | ✅ | Admin Settings → Email; DB-only, no env. |
| 2FA (Admin) | ✅ | Enable/disable in Settings; TOTP at login. |

---

## 10. Email Notifications

| Item | Status | Gap |
|------|--------|-----|
| Customer: verify account | ✅ | Code by email + verify-email page. |
| Customer: upload received | ✅ | — |
| Customer: new offers | ✅ | — |
| Customer: booking confirmed | ✅ | — |
| Customer: payment confirmed | ⬜ | Depends on Klarna flow. |
| Customer: 24h reminder | ✅ | Cron/sendReminder24h. |
| Customer: job complete + review request | ✅ | — |
| Workshop: welcome | ✅ | After admin approval. |
| Workshop: new request | ✅ | — |
| Workshop: booking confirmed | ✅ | — |
| Workshop: payout report | ⬜ | — |
| Admin: payout/commission reports | ⬜ | — |

*Email sending uses DB config only (Admin Settings → SMTP).*

---

## 11. Hosting & Infrastructure

| Item | Status | Gap |
|------|--------|-----|
| Domain | 🔶 | Ready per spec. |
| Hosting (VPS/managed) | ⬜ | Setup + env vars. |
| GitHub repo | ⬜ | Org setup, collaboration. |
| Transactional email provider | 🔶 | Nodemailer + DB SMTP config; provider (SendGrid/Postmark) optional. |

---

*Last updated from implementation state. Adjust status as you complete items.*
