# Fix2An Elite UX/UI Specification

**Purpose**: Developer-ready specification for implementing UX/UI improvements across the Fix2An platform.
**Goal**: Improve clarity, trust, and conversion for both car owners and workshop partners.

---

## 1. Landing Page Strategy
**Rule**: The main landing page (`/`) must focus exclusively on **customers** (car owners). Workshop-focused messaging must be moved to a separate dedicated page.

### Customer Homepage (`/`)
- **Hero Section**: Strengthen value proposition for car owners. Clear "Upload Protocol" CTA.
- **Trust Signals**: Move reviews, certifications, and security icons higher up (sub-hero).
- **Simplified Flow**: Explain the process in 3 easy steps instead of a full dashboard-style overview.
- **Action**: Remove all "For Workshops" benefit sections and sign-up blocks from this page.

### Workshop Landing Page (`/workshop`) [NEW]
- **Value Proposition**: Focus on increasing workshop revenue and streamlining repair requests.
- **Components**: Business-focused hero, trust/benefit sections, and a primary "Sign Up Your Workshop" CTA.
- **Navigation**: Linked via a secondary "For Workshops" link in the main navbar.

---

## 2. Customer Experience (UX)

### My Cases – Empty State
- **Onboarding**: Guide new users through their first upload rather than showing a blank table.
- **Logic**: Hide filters (Booked, Completed, etc.) when the list is empty.
- **Trust**: Add a reassuring message about data security and workshop verification.

### Cancel Booking Modal
- **Clarity**: Rename to "Cancel Booking".
- **Impact**: Explain that cancellation is final and cannot be undone. Link to policy.
- **Hierarchy**: Primary button = "Keep Booking", Secondary/Neutral = "Confirm Cancellation".

---

## 3. Workshop Experience (UX)

### Create Offer Form
- **Pricing**: Show "Total Price including VAT" prominently.
- **Validity**: Add clear selection for offer validity (e.g., 7 days, 30 days).
- **Structure**: Split "Description" into separate fields/summaries for Labor, Materials/Parts, and Inclusions.
- **Slots**: Improved UI for adding multiple available time windows.

### Offers List (Management)
- **Locking**: Once an offer status is "SENT", it MUST be locked. No direct editing allowed.
- **Actions**: Replace "Edit" with "View". Add "Duplicate & Edit New" if changes are needed.
- **Status Icons**: Use consistent colors for badges (Success=Green, Pending=Blue, Cancelled=Red).
- **Summary**: Show VAT, Currency (SEK), and Estimated Duration in the list view.

---

## 4. Execution Phase (Contracts)

### Workshop Contracts View
- **Tab Renaming**: Clearer sections: "Active Jobs" and "Past Records" with total counts.
- **Per-Card Badges**: Add visible status icons for live tracking (e.g., "Awaiting Car", "In Progress").
- **Action Focus**: Single primary "Mark as Completed" button. Secondary "Cancel" action.
- **UI Safety**: Ensure overlays and menus do not overlap content.

---

## 5. State Logic & Implementation Rules
- **CTA Rule**: Each key screen should have exactly one primary Call-to-Action.
- **Status Consistency**: Status labels and colors must match across all views (Customer, Workshop, Admin).
- **Finality**: Sent offers must be locked to prevent trust erosion with the customer.
