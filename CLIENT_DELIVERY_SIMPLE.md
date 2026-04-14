# Fix2An — Delivery Report
**Date:** 14 April 2026

---

## What Has Been Completed ✅

### 1. Workshop Page is Now Separate
The main website homepage now shows **only customer content**. All workshop-related content has been moved to its own dedicated page at `/workshop`. A **"For Workshops"** link has been added to the top navigation bar so workshops can easily find their page.

---

### 2. My Cases — Empty State Improved
When a customer logs in for the first time and has no cases yet, the screen now:
- Shows **one clear button** — "Upload Repair Request" (previously there were two confusing buttons doing the same thing)
- **Hides all filter tabs** until the customer actually has cases (no more empty filter tabs showing)
- Shows a **3-step guide**: Upload → Receive Bids → Book Workshop
- Shows a **trust message**: *"Only verified workshops can view your request details"*

---

### 3. Sent Offers Are Now Locked
Once a workshop sends an offer to a customer, the offer is **permanently locked**. The workshop cannot go back and change the price or details after sending. If they try, they see a clear message:
> *"Sent offers are locked to ensure pricing trust with the customer."*

---

### 4. Create Offer Form — Improved
The form workshops use to send offers has been updated:
- The price field now clearly says **"Total Price (VAT Included)"** — no more confusion about whether VAT is included
- There are now separate fields for **Labor Cost** and **Materials & Parts** so the customer can see the full breakdown
- The offer validity now uses **clear buttons**: 7 Days / 14 Days / 30 Days — instead of typing a number manually
- The **Included Services** field is now a larger text box (not a single-line input) with a hint: *"e.g. Free pick-up, 2-year warranty on parts, courtesy car included"* — so workshops know what to write

---

### 5. Contracts Screen — Clearer Actions
The screen where workshops manage their active jobs has been improved:
- **"Done"** is now the main green button — easy to find and click when a job is complete
- **"Cancel"** is now a smaller secondary button — less likely to be pressed by accident
- The customer's **phone number is now tappable** — workshop can call directly from the screen
- The customer's **email is now tappable** — workshop can email directly from the screen
- Each contract card now shows a **status badge** (Active / Cancelled / Completed)
- Tabs have been renamed to **"Active Jobs"** and **"Past Records"** for clarity
- Tabs now show **live job counts** — e.g. "Active Jobs (3)" and "Past Records (12)"
- Each card now shows the **estimated job duration** next to the scheduled time — e.g. `~45 min` or `~1h 30m`
- Price on each card now clearly shows **"inkl. moms"** (VAT included) beneath it

---

### 6. Cancel Contract Modal — Updated
When a workshop tries to cancel a contract, the popup now:
- Shows a clear title: **"Cancel Contract"**
- Shows a red warning: *"This action cannot be undone and may affect your ratings"*
- **Requires the workshop to type a reason** before they can confirm cancellation
- Has correct button layout: **"No, Keep It"** (big, safe button) and **"Yes, Cancel Contract"** (smaller, destructive button)
- Shows a **link to the Cancellation Policy** below the reason box so workshops know what they are agreeing to

---

### 7. Homepage — Cleaned Up
The homepage has been improved:
- The **"How It Works" step-by-step guide** has been removed from the homepage (it belongs inside the upload flow, not on the landing page)
- The **three benefit cards** (Verified Workshops / Free to Use / Fast Responses) now appear **immediately below the hero** — visible without scrolling
- A **"Fix2An Certified Workshops Only"** trust badge now appears below the main call-to-action button

---

### 8. Proposals Page — Status Colours Fixed
The list of offers a workshop has sent now shows **colour-coded status badges**:
- **Blue** — Sent (waiting for customer response)
- **Green** — Accepted
- **Gray** — Declined
- **Orange** — Expired
- **Red** — Cancelled

Previously all badges looked the same.

---

### 9. Mobile Bug Fixed — Profile Menu
On mobile phones, the profile dropdown menu was appearing behind page content. It now always appears **on top of everything**, no matter which page the workshop is on.

---

### 10. Bug Fixes (Technical)
Three silent bugs were found and fixed:
- A link on the customer cancellation screen was pointing to a page that does not exist — now correctly links to the Fix2An policy page
- The homepage was running hidden background code on every scroll (doing nothing but wasting resources) — removed
- Several unused code imports were cleaned up from multiple pages — keeps the app fast and error-free

---

## Nothing Remaining ✅

All 10 previously listed remaining items have now been completed.

| # | Item | Status |
|---|------|--------|
| 1 | Homepage: move trust badges above the scroll line | ✅ Done |
| 2 | Homepage: add "Fix2An Certified" trust section | ✅ Done |
| 3 | Homepage: remove step-by-step guide | ✅ Done |
| 4 | Contracts: show job count on tabs e.g. "Active Jobs (3)" | ✅ Done |
| 5 | Contracts: show estimated job duration on each card | ✅ Done |
| 6 | Offers + Contracts: show price with VAT label | ✅ Done |
| 7 | Fix: profile menu covers content on mobile | ✅ Done |
| 8 | Cancel modal: add link to cancellation policy | ✅ Done |
| 9 | Offer form: add hints for included services field | ✅ Done |
| 10 | Offers list: fix status badge colours | ✅ Done |

---

*Total completed: 30+ changes across 7 screens*
*Total remaining: 0*
