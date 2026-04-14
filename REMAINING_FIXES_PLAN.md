# Fix2An — Complete Fixes & Bugs Plan
**Date:** 2026-04-14
**Audit result:** 3 real bugs found + 10 remaining spec items

---

## ⚠️ BUGS FOUND (Fix These First)

These are actual code errors that affect users right now.

---

### BUG 1 — Broken Link: "Read Policy" goes to 404
**File:** `Frontend/src/pages/MyCasesPage.jsx` — Line 975
**Severity:** High — clicking this crashes the user to a blank page

**What's happening:**
In the customer's Cancel Booking modal, there is a "Read Policy" link:
```
<Link to="/policy/cancellation">Read Policy</Link>
```
But the route `/policy/cancellation` does **not exist** in `AppRoutes.jsx`. When a customer clicks it, they are taken to a blank page and lose their cancellation flow.

**Fix:** Either:
- Create a simple `/policy/cancellation` page and add the route in `AppRoutes.jsx`, OR
- Change the link to open the existing `/how-it-works` page or a relevant anchor, OR
- Temporarily remove the link until the policy page is built

---

### BUG 2 — Dead Scroll Code Running on Every Scroll (Performance)
**File:** `Frontend/src/pages/HomePage.jsx` — Lines 21–22 and 51–103
**Severity:** Medium — wastes CPU on every scroll, no visual effect

**What's happening:**
The homepage has two `useEffect` hooks that listen to scroll events and try to find an element with `id="cta-section"` to calculate a parallax effect. But there is **no element with that ID** anywhere in the current JSX — it was removed at some point. So:
- `ctaSectionTop` is always `0`
- `parallaxOffset` is set but **never used** in the JSX
- Both scroll listeners fire on every single scroll event and do nothing

**Fix:** Remove:
- `parallaxOffset` state (line 21)
- `ctaSectionTop` state (line 22)
- The entire first `useEffect` (lines 51–63, the one that calls `updateCtaPosition`)
- The entire second `useEffect` (lines 65–103, the parallax scroll handler)

---

### BUG 3 — Unused Imports in HomePage (Console Warnings)
**File:** `Frontend/src/pages/HomePage.jsx` — Lines 5, 9, 14
**Severity:** Low — causes lint/console warnings, slightly bloats bundle

**What's happening:**
Several imports exist that are never used anywhere in the JSX:

| Import | Used? |
|--------|-------|
| `HeroCarousel` | ❌ Never used |
| `FrameImage` | ❌ Never used (used in WorkshopLandingPage, not here) |
| `Star` | ❌ Never used |
| `Timer` | ❌ Never used |
| `Heart` | ❌ Never used |
| `Receipt` | ❌ Never used |
| `ArrowRight` | ❌ Never used |
| `Building2` | ❌ Never used |
| `DollarSign` | ❌ Never used |
| `Calendar` | ❌ Never used |
| `Award` | ❌ Never used |
| `Shield` | ❌ Never used |
| `CertifiedImage` | ❌ Not yet used (will be needed for Fix 7 below) |

**Fix:** Remove all unused imports. Keep `CertifiedImage` if implementing Fix 7 (certified badge) at the same time.

---

## SPEC ITEMS REMAINING (10 items)

These are features from the UX spec that have not been built yet.

---

### Fix 1 — Status Badge Colours (Proposals Page)
**File:** `Frontend/src/pages/WorkshopProposalsPage.jsx` — Lines 107–168
**Difficulty:** Easy

**Problem:** SENT, ACCEPTED, and EXPIRED all show the same green — impossible to distinguish at a glance.

**Fix — change each status colour in `getStatusBadge()` and `getStatusIconColor()`:**

| Status | Badge colour | Icon colour |
|--------|-------------|-------------|
| SENT | Blue `bg-blue-50 text-blue-700 border-blue-200` | `#1d4ed8` |
| ACCEPTED | Green ✅ keep | keep |
| DECLINED | Gray `bg-gray-100 text-gray-500 border-gray-200` | `#6b7280` |
| EXPIRED | Orange `bg-orange-50 text-orange-700 border-orange-200` | `#c2410c` |
| CANCELLED | Red ✅ keep | keep |

---

### Fix 2 — VAT Label on Price
**Files:**
- `Frontend/src/pages/WorkshopProposalsPage.jsx` (~line 355)
- `Frontend/src/pages/WorkshopContractsPage.jsx` (~line 602)
**Difficulty:** Easy

**Problem:** Price is shown as a bare number with no VAT mention.

**Fix:** Add `inkl. moms` in tiny gray text directly below the price on both pages:
```jsx
<p className="text-base font-bold text-[#34C759]">{formatPrice(offer.price)}</p>
<p className="text-[10px] text-gray-400 font-medium">inkl. moms</p>
```
**Note:** The details modal in Contracts already has "VAT INCLUDED" — don't touch that, only card-level price.

---

### Fix 3 — Description Hints in Offer Form
**File:** `Frontend/src/pages/CreateOfferPage.jsx` — Lines 649–663
**Difficulty:** Easy

**Problem:** The "Included Services" field is a plain single-line input with no guidance.

**Fix:** Swap the `<Input>` at line 655 for a `<Textarea>` (already imported) with a helpful placeholder:
```jsx
<Textarea
  id="inclusions"
  rows={3}
  value={formData.inclusions}
  disabled={viewMode}
  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
  placeholder="E.g.: Labor: 2 hours, Parts: Brake pads (OEM), Includes: Free car wash after service"
  className="text-sm resize-none"
/>
```
Remove the old `className="h-10 text-sm"` from the Input — height is now controlled by `rows={3}`.

---

### Fix 4 — Tab Counts in Contracts
**File:** `Frontend/src/pages/WorkshopContractsPage.jsx` — Lines 107–178 and 466–492
**Difficulty:** Easy

**Problem:** Tabs show "Active Jobs" / "Past Records" with no count.

**Fix:**
1. Refactor `getFilteredContracts()` to accept a `tab` parameter instead of reading from `activeTab` state
2. Pre-compute both counts before the return statement:
```jsx
const currentCount = getFilteredContracts('current').length
const completedCount = getFilteredContracts('completed').length
```
3. Show counts in tab buttons:
```jsx
Active Jobs ({currentCount})
Past Records ({completedCount})
```

---

### Fix 5 — Remove "How It Works" from Homepage
**File:** `Frontend/src/pages/HomePage.jsx` — Lines 196–246
**Difficulty:** Easy

**Problem:** The 3-step flow section is shown on the homepage before the user has done anything — spec says move it to the upload journey.

**Fix:** Delete the entire `<section id="how-it-works-section">` block (lines 196–246) including all blank lines after it (lines 247–257).

**After deleting:** Remove `Car` from the lucide-react import on line 5 (only used in step 3 of that section, nowhere else in HomePage).

---

### Fix 6 — Move Trust Badges Above the Fold
**File:** `Frontend/src/pages/HomePage.jsx` — Lines 121–194
**Difficulty:** Medium

**Problem:** The 3 trust cards (Verified, Free, Fast) are below the hero — users must scroll to see them.

**Fix (recommended — Option A):** Cut the entire Benefits `<section>` block (lines 147–194) and paste it directly after the hero section closing tag (line 145). Reduce padding from `py-20` to `py-8 md:py-12` so it stays compact.

**Alternative (Option B — lighter):** Keep the full cards below, and add a compact inline trust strip directly under the CTA button:
```jsx
<div className="flex flex-wrap justify-center gap-4 mt-5 text-xs text-gray-500 font-medium">
  <span className="flex items-center gap-1.5">
    <CheckCircle className="w-3.5 h-3.5 text-[#34C759]" /> Verified Workshops
  </span>
  <span className="flex items-center gap-1.5">
    <CheckCircle className="w-3.5 h-3.5 text-[#34C759]" /> Completely Free
  </span>
  <span className="flex items-center gap-1.5">
    <Clock className="w-3.5 h-3.5 text-[#34C759]" /> Fast Offers
  </span>
</div>
```

**Test:** After the change, verify on 375px mobile that trust signals are visible without scrolling.

---

### Fix 7 — "Fix2An Certified" Badge in Hero
**File:** `Frontend/src/pages/HomePage.jsx` — Lines 130–143
**Difficulty:** Medium

**Problem:** No "certified" trust signal near the hero — first impression feels bare.

**Fix:** Add a small trust line directly below the CTA button (after the closing `</Link>` around line 142):
```jsx
<div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-gray-400">
  <img src={CertifiedImage} alt="Fix2An Certified" className="w-4 h-4 object-contain" />
  <span>Fix2An Certified Workshops Only</span>
</div>
```
`CertifiedImage` is already imported at line 15 — just needs to be used.

---

### Fix 8 — Estimated Duration on Contracts Card
**File:** `Frontend/src/pages/WorkshopContractsPage.jsx` — Lines 580–597
**Difficulty:** Medium

**Problem:** Workshops can see appointment date/time but not how long the job is estimated to take.

**Fix:** Add estimated duration next to the time, inside the existing date/time row:
```jsx
{offer.estimatedDuration && (
  <>
    <div className="w-px h-3.5 bg-gray-300 md:hidden"></div>
    <div className="flex items-center gap-2 text-gray-400">
      <Clock className="w-3.5 h-3.5 text-gray-300" />
      <span className="text-[11px] font-bold">
        {offer.estimatedDuration >= 60
          ? `~${Math.floor(offer.estimatedDuration / 60)}h${offer.estimatedDuration % 60 > 0 ? ` ${offer.estimatedDuration % 60}m` : ''}`
          : `~${offer.estimatedDuration} min`}
      </span>
    </div>
  </>
)}
```
Older offers without this value will simply not show the field (safe fallback).

---

### Fix 9 — Cancellation Policy Link in Workshop Cancel Modal
**File:** `Frontend/src/pages/WorkshopContractsPage.jsx` — Lines 401–454
**Difficulty:** Medium

**Problem:** Workshop cancel contract modal has no policy link (the customer's cancel booking modal on MyCasesPage already has one — but it links to `/policy/cancellation` which doesn't exist — see Bug 1 above).

**Fix:** Add a small link below the reason textarea (around line 428). Until a policy page is built, link to the `/workshop` page or show a toast with a basic explanation:
```jsx
<div className="flex justify-center mt-2">
  <a
    href="/policy/cancellation"
    target="_blank"
    rel="noopener noreferrer"
    className="text-[11px] text-[#34C759] hover:underline font-semibold"
  >
    Read Cancellation Policy →
  </a>
</div>
```
**Note:** Fix Bug 1 first (create the policy page/route) — then this link will work correctly.

---

### Fix 10 — Profile Menu Overlap Bug on Mobile
**Files:**
- `Frontend/src/components/WorkshopBottomNav.jsx` — Line 93
- `Frontend/src/pages/WorkshopContractsPage.jsx` — Line 457
**Difficulty:** Medium

**Problem:** On mobile, the profile dropdown from the bottom nav overlaps contract cards. Animated cards (CSS `transform` via `animate-fade-in-up`) create isolated stacking contexts that trap z-index values — the dropdown appears behind them.

**Two-part fix:**

**Part 1 — WorkshopBottomNav.jsx line 93:** Change `z-50` to `z-[60]` on the dropdown container:
```jsx
className="absolute bottom-full mb-3 right-[-12px] w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-[60]"
```

**Part 2 — WorkshopContractsPage.jsx line 457:** Increase bottom padding on mobile from `pb-20` to `pb-28 md:pb-20`:
```jsx
<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 md:pb-20 w-full">
```

---

## Final Implementation Order

**Do bugs first:**

| Priority | Item | File | Lines |
|----------|------|------|-------|
| 🔴 Bug 1 | Create `/policy/cancellation` route or fix link | `MyCasesPage.jsx` + `AppRoutes.jsx` | 975 |
| 🔴 Bug 2 | Remove dead scroll/parallax code | `HomePage.jsx` | 21–22, 51–103 |
| 🟡 Bug 3 | Remove unused imports | `HomePage.jsx` | 5, 9, 14 |

**Then spec items (easy → hard):**

| # | Fix | File | Difficulty |
|---|-----|------|-----------|
| 1 | Status badge colours | `WorkshopProposalsPage.jsx` | Easy |
| 2 | VAT label on price | `WorkshopProposalsPage.jsx` + `WorkshopContractsPage.jsx` | Easy |
| 3 | Description hints in offer form | `CreateOfferPage.jsx` | Easy |
| 4 | Tab counts in contracts | `WorkshopContractsPage.jsx` | Easy |
| 5 | Remove "How it works" from homepage | `HomePage.jsx` | Easy |
| 6 | Certified badge in hero | `HomePage.jsx` | Medium |
| 7 | Move trust badges above the fold | `HomePage.jsx` | Medium |
| 8 | Estimated duration on contract card | `WorkshopContractsPage.jsx` | Medium |
| 9 | Policy link in workshop cancel modal | `WorkshopContractsPage.jsx` | Medium |
| 10 | Profile menu overlap bug | `WorkshopBottomNav.jsx` + `WorkshopContractsPage.jsx` | Medium |

---

*Last audit: 2026-04-14 — full codebase review of all spec screens*
