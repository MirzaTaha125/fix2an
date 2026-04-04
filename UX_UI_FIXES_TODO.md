# Fix2An Elite UX/UI - Implementation Checklist

Track our progress on the Elite UX/UI Specification here.

## 1. Landing Page Overhaul
- [x] **Simplify Customer Homepage (`HomePage.jsx`)**
  - [x] Remove all workshop registration sections.
  - [x] Remove all workshop benefit/certified sections.
  - [x] Reorder Hero sections (Move trust signals to sub-hero).
  - [x] Simplify "How it Works" into 3 steps.
  - [x] Consolidate primary CTA ("Start now").

- [x] **New Workshop Landing Page (`WorkshopLandingPage.jsx`)** [NEW]
  - [x] Create the new page at `/workshop`.
  - [x] Implement workshop-focused hero and benefits.
  - [x] Integrate "Certified By" and "Revenue" messaging.
  - [x] Update `AppRoutes.jsx` with the new route.
  - [x] Add "For Workshops" link to `Navbar.jsx`.

## 2. Customer Dashboard & Flow
- [x] **My Cases - Onboarding & Empty State**
  - [x] Hide filters/tabs when there are no cases.
  - [x] Add visual onboarding guide for first upload.
  - [x] Add "Only approved workshops respond" trust message.
  - [x] Consolidate duplicate upload buttons.

- [x] **Cancel Booking Modal**
  - [x] Rename modal title to "Cancel Booking".
  - [x] Add "cannot be undone" warning and link to policy.
  - [x] Improve button hierarchy (Primary="Keep Booking").

## 3. Workshop Experience & Logic
- [x] **Create Offer Form Enhancements**
  - [x] Clear VAT pricing labels and totals.
  - [x] Add "Offer Validity" selection.
  - [x] Split description into Labor / Materials / Inclusions.
  - [x] Improved time slot selection UI.

- [x] **Offers List Rules & Locking**
  - [x] Implement locking logic for status "SENT" (Disable Edit).
  - [x] Replace "Edit" with "View".
  - [x] Standardize status badge colors and icons.
  - [x] Show VAT and Currency summary per offer.

## 4. Job Execution (Contracts)
- [x] **Workshop Contracts View**
  - [x] Rename tabs to "Active Jobs" and "Past Records".
  - [x] Add visible job counts to tabs.
  - [x] Add per-card status badges.
  - [x] Group customer info with one-tap contact buttons (Call/Email).
  - [x] Highlight "Mark as Completed" as the primary CTA.
  - [x] Fix profile menu overlap bug.

---

## Progress Overview
- Total Tasks: 23
- Completed: 23
- Progress: 100%
