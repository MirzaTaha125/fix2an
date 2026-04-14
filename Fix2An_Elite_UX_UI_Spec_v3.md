# Fix2An Elite UX/UI Specification v3
**Developer-ready document with all annotated screens, final logo, and landing-page separation rules**

---

## Document Info

| Field | Value |
|---|---|
| Purpose | Explain every required UX/UI change clearly with visual references |
| Audience | Developer / builder / designer |
| Critical rule | The main landing page must target **customers only**. Workshops must have a **separate page**. |
| Deliverable | Implement the changes in the order listed below and ask before deviating |

---

## Status Legend
- ✅ Done
- ⚠️ Partially done
- ❌ Not done yet

---

## Core Rules

- ✅ Main landing page = **customer only**. No workshop-focused messaging on the customer homepage.
- ✅ Workshop content must live on a separate page such as `/workshop` or `/for-workshops`.
- ✅ **Sent offers must be locked after submission.**
- ⚠️ Status labels and colours must be consistent across all customer, workshop, and contract views. *(status badges exist but colours are not fully consistent — e.g. SENT, EXPIRED, ACCEPTED all show same green in proposals)*
- ✅ Each key screen should have **one clear primary CTA**.
- ❌ Dropdowns, menus, and overlays must **never cover critical content**. *(profile menu overlap bug still present in contracts screen)*

---

## Recommended Implementation Order

1. ✅ Homepage and onboarding improvements
2. ✅ Separate workshop landing page
3. ✅ My Cases empty-state improvements
4. ⚠️ Create Offer form improvements
5. ⚠️ Offers list rules and trust improvements
6. ⚠️ Contracts execution flow
7. ⚠️ Cancel booking modal

---

## Final Logo

- ✅ "Fixa" in **dark navy blue**, "2an" in **bright green**
- ✅ The "2" has a **green checkmark circle** above it
- ✅ White/light background
- ✅ This is the **official approved logo** — use this across all screens

---

## 1. Customer Homepage / Hero Section ⚠️ Partially Done

**Goal:** Improve first impression, clarity, and trust for car owners.

### Issues Found (from annotated screenshot)
- First impression needs stronger trust, clarity, and differentiation
- Missing trust & differentiation — no "WHY choose us?" explained
- "Quality controlled" and "Completely free" trust signals exist but are **too far down** — should be above the fold
- No "Fix2an Certified" concept shown for trust

### Required Changes
- ✅ Keep the homepage focused on **car owners only** — no workshop content on this page
- ✅ CTA button present and dominant ("Get Offers" style)
- ✅ Trust signal cards exist (Verified workshops, Completely free, Fast)
- ❌ Trust signals still placed **below the fold** — spec says move them above the fold
- ❌ "Fix2an Certified" concept NOT yet added to homepage

> **Developer note:** Do not place workshop-focused content on this page.

---

## 2. Homepage Flow / First-Step Explanation ❌ Not Done

**Goal:** Keep the homepage simpler and avoid showing the full process too early.

### Issues Found (from annotated screenshot)
- Step-by-step flow is shown **too early** — before the user has even uploaded anything
- Flow is good but should appear **after upload**, not on the homepage
- Current CTA is dominant but step-by-step "How it works" section still on homepage

### Required Changes
- ❌ **"How it works" section still on homepage** — spec says move it to the upload/request journey
- ✅ Primary CTA is dominant
- ❌ Homepage is still showing full step-by-step flow (shown too early per spec)
- ❌ Simpler, shorter homepage message not yet implemented

> **Developer note:** This screen should support the homepage, not compete with it.

---

## 3. Separate Workshop Landing Page ✅ Done

**Goal:** Move all workshop-targeted communication away from the customer homepage.

### Required Changes
- ✅ Dedicated workshop page exists at `/workshop` (`WorkshopLandingPage.jsx`)
- ✅ Has its own hero headline, trust section ("Fix2an Certified"), and CTAs
- ✅ Workshop value proposition and signup CTA are on this page
- ✅ Navbar shows **"For Workshops"** link (both desktop and mobile)
- ✅ No workshop messaging on the main customer homepage

> **Developer note:** This is a product and conversion rule, not just a copy change.

---

## 4. My Cases — Empty State ✅ Done

**Goal:** Turn the empty state into guided onboarding instead of a passive blank state.

### Required Changes
- ✅ Only **ONE CTA** in empty state — "Upload Repair Request" button
- ✅ Filters / tabs hidden when user has no cases (`{requests.length > 0 && (tabs)}`)
- ✅ Stronger CTA wording: "Upload your repair protocol or vehicle photos to receive competitive offers"
- ✅ 3-step visual illustration added (1. Upload Details → 2. Receive Bids → 3. Book Workshop)
- ✅ Trust message added: *"Only verified workshops can view your request details"*

> **Developer note:** This screen should help the user move forward immediately.

---

## 5. Create Offer Form ⚠️ Partially Done

**Goal:** Improve offer quality, reduce ambiguity, and make every sent offer trustworthy.

### Issues Found (from annotated screenshot)
- Price field does not clearly show total including VAT
- Validity period uses a text input — should use radio buttons
- Offer description field is open-ended with no guidance
- Time slot tools are hard to use
- Primary CTA is too weak and vague

### Required Changes

#### Price (Pris)
- ✅ Total price label now says **"Total Price (VAT Included)"**
- ✅ Labor Cost and Materials & Parts shown as separate breakdown fields

#### Validity (Giltighetstid)
- ✅ **Radio-style buttons** implemented: 7 days / 14 days / 30 days

#### Offer Description
- ⚠️ Warranty field and inclusions/note fields exist — but **no bullet suggestions** for labor/materials/parts guidance
- ❌ No AI-fill suggestions for time slots
- ❌ No explicit bullet guide for what to include in the description

#### Lock Offer After Sending
- ✅ Offers with status SENT/ACCEPTED/EXPIRED/CANCELLED show a **locked screen** — editing is blocked
- ✅ Lock message shown: *"Sent offers are locked to ensure pricing trust with the customer"*

#### Primary CTA
- ⚠️ Submit button exists but wording is generic — spec says make it: *"Skicka erbjudande – bekräfta 250 kr"*

> **Developer note:** This is one of the most important screens in the product because it directly affects trust and acceptance rate.

---

## 6. Offers List (Workshop Side) ⚠️ Partially Done

**Goal:** Make sent offers final, understandable, and trustworthy.

### Issues Found (from annotated screenshot)
- Price shown without clear SEK + VAT breakdown
- Offers can currently be edited after sending — breaks trust
- Status labels are inconsistent and unclear
- No short summary info per offer card

### Required Changes

#### Price Clarity
- ⚠️ Price shown in proposals list but **no explicit VAT label** — spec says show "SEK + VAT"

#### Lock Offers After Sending
- ✅ Navigating to edit a SENT offer shows a locked/blocked screen (`CreateOfferPage.jsx:247`)
- ✅ Edit is blocked for SENT, ACCEPTED, EXPIRED, CANCELLED offers
- ❌ Proposals list still shows offer cards without a clear "View only" indicator — no "View" button replacing "Edit"

#### Status System
- ⚠️ Status badges exist in proposals page but **colours are inconsistent** — SENT, EXPIRED, and ACCEPTED all use same green colour class

#### Offer Cards
- ⚠️ Some summary info shown (customer, vehicle, date) but no explicit VAT breakdown

> **Developer note:** This prevents trust issues and makes pricing feel final and professional.

---

## 7. Contracts / Execution Phase ⚠️ Partially Done

**Goal:** Make active work clear and completion-focused.

### Issues Found (from annotated mobile screenshot)
- Tabs not clearly labelled; no counts
- No status badges on cards
- Customer info scattered; no call button
- Price without VAT; no estimated duration
- No "Mark as completed" primary action
- Profile menu overlaps content — confirmed bug

### Required Changes

#### Tabs
- ⚠️ Tabs renamed to **"Active Jobs" / "Past Records"** — close to spec but spec says "Active / Completed"
- ❌ **No counts** added to tabs (e.g. "Active Jobs (3)")

#### Card Status Badges
- ✅ Status badge per card — shows booking status (Active / Cancelled / etc.)

#### Customer Info
- ✅ Customer name, phone, and email grouped on each card
- ✅ Phone is a **clickable `tel:` link** for calling

#### Price & Time
- ✅ Price displayed per card
- ⚠️ **No explicit VAT label** on price — spec says show "SEK + VAT"
- ⚠️ Scheduled date/time shown but **no "Estimated Duration"** displayed on card

#### Actions
- ✅ **"Done" primary action** exists and opens confirm dialog
- ✅ Cancel is **secondary/outline** button — correct hierarchy

#### Bug Fix — Profile Menu Overlap
- ❌ **Profile menu overlap bug still present** — Navbar dropdown can cover content on contracts/mobile screens

> **Developer note:** This screen represents live execution and therefore needs very high clarity and confidence.

---

## 8. Cancel Booking Modal ⚠️ Partially Done

**Goal:** Make cancellation feel clear, serious, and policy-safe.

### Issues Found (from annotated desktop screenshot)
- Current title "Avbryt jobb" is vague
- No consequences or fees shown
- No link to cancellation policy
- Button hierarchy is weak

### Required Changes

#### Title
- ✅ Title changed to: **"Cancel Contract"** (clear, serious)

#### Body
- ✅ Warning shown: *"Warning: This action cannot be undone and may affect your ratings"*

#### Policy Link
- ❌ **No link to cancellation policy** — spec says add link to "gällande avbokningsregler"

#### Buttons
- ✅ **Primary:** "No, Keep It" — strong, navy coloured button
- ✅ **Secondary:** "Yes, Cancel Contract" — ghost/light button
- ✅ **Cancellation reason is required** before confirming

> **Developer note:** This is a sensitive screen and must reduce conflict risk.

---

## State Logic & Implementation Rules

- ✅ Sent offers must be **locked after submission**
- ✅ Every important screen supports: **loading** state (skeletons everywhere), empty states
- ⚠️ Error states exist but not consistently handled on all screens
- ✅ Tabs and filters **hidden in empty states** (My Cases, Contracts)
- ✅ A single strong **primary CTA** visible on each key screen
- ❌ Profile menu/dropdown **can still overlap** content (bug not yet fixed)

---

## Summary — What's Left To Do

| # | Item | Status |
|---|------|--------|
| 1 | Move trust signals above the fold on homepage | ❌ |
| 2 | Add "Fix2an Certified" concept to homepage | ❌ |
| 3 | Move "How it works" section off homepage → to upload journey | ❌ |
| 4 | Add counts to Contracts tabs (Active Jobs (3)) | ❌ |
| 5 | Show Estimated Duration on Contracts card | ❌ |
| 6 | Add VAT label to price on Proposals list and Contracts cards | ❌ |
| 7 | Fix profile menu overlap bug on mobile/contracts | ❌ |
| 8 | Add cancellation policy link to cancel modal | ❌ |
| 9 | Add bullet suggestions to offer description field | ❌ |
| 10 | Fix inconsistent status badge colours in Proposals page (SENT/EXPIRED/ACCEPTED all green) | ❌ |

---

*Document version: v3 — All images integrated*
*Last audit: 2026-04-14*
