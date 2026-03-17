# UI & Styling Reference (from mobile reference images)

This document describes the **visual styling** from the reference screens: colors, typography, cards, buttons, spacing, and components. Use this to align the app UI with the references.

---

## 1. Color palette

| Use | Reference | Suggested value | Tailwind / CSS |
|-----|-----------|-----------------|----------------|
| **Primary text / headings / logo "Fixa"** | Dark blue | `#05324f` (navy) | `text-brand-navy` / `#05324f` |
| **Accent / CTA / active state / logo "2an"** | Bright green | `#34C759` | `bg-brand-green` / `#34C759` |
| **Background** | White | `#FFFFFF` | `bg-white` |
| **Card background** | White, sometimes very light grey | White or `#F9FAFB` | `bg-white` or `bg-gray-50` |
| **Body / secondary text** | Dark grey | ~`#374151` / `#4B5563` | `text-gray-700` / `text-gray-600` |
| **Muted / labels / distance** | Lighter grey | ~`#6B7280` / `#9CA3AF` | `text-gray-500` / `text-gray-400` |
| **Inactive filter pills** | Light grey bg | ~`#E5E7EB` / `#F3F4F6` | `bg-gray-200` / `bg-gray-100` |
| **Active filter pill** | Bright green bg, white text | `#34C759` | `bg-brand-green text-white` |
| **Stars (rating)** | Yellow | e.g. `#EAB308` | `text-yellow-500` |
| **Button text on green** | White | `#FFFFFF` | `text-white` |
| **Bottom nav active** | Blue (workshop app) | Same dark blue | `text-brand-navy` |
| **Bottom nav inactive** | Dark grey | `#6B7280` | `text-gray-500` |
| **Card border / separator** | Very light grey | ~`#E5E7EB` / `#F3F4F6` | `border-gray-200` |

---

## 2. Typography

- **Font:** Sans-serif (Poppins/Inter is fine; reference is clean, modern sans).
- **Page title** (e.g. "Your offers", "My cases"): Large, **bold**, dark blue. ~22–24px.
- **Section headings** (e.g. "Ongoing requests", "Offer inbox"): Bold, dark blue. ~18–20px.
- **Card primary** (workshop name, car model, total price): **Bold**, dark grey/blue. ~16–18px.
- **Price (big number):** Large, bold, dark blue. Prominent on screen.
- **Body text** (dates, address, description): Regular weight, dark grey. ~14–16px.
- **Secondary / labels** (distance, "km from you", "Latest 2 May"): Smaller, lighter grey. ~12–14px.
- **Action links** (e.g. "Show offer list", "Show details"): Green, regular weight, no underline.
- **Button label:** White, bold on green buttons.

---

## 3. Cards

- **Background:** White (or very light grey for section cards like "My cases").
- **Corners:** Softly rounded. Reference ~12px → use `rounded-card` (12px) or `rounded-xl`.
- **Shadow / border:** Very subtle. Either:
  - **Option A:** Very light shadow, e.g. `0 1px 3px rgba(0,0,0,0.06)` or `shadow-sm`.
  - **Option B:** Thin light grey border: `border border-gray-200`.
- **Spacing inside:** Generous padding (e.g. 16–20px). Content not cramped.
- **Layout:** Clear hierarchy: title/name at top, then details, then action. Right-aligned values (e.g. price) where it’s a list of line items.

---

## 4. Buttons

**Primary (green CTA)**  
- Full-width or prominent (e.g. "Select", "Book workshop", "Upload new protocol").  
- Background: bright green `#34C759`.  
- Text: white, bold.  
- Corners: rounded (e.g. 10–12px).  
- Optional: camera (or other) icon left of text, white.  
- Height: touch-friendly (e.g. 44–48px on mobile).

**Filter pills** (e.g. Price, Distance, Rating)  
- Horizontal row of pills.  
- **Active:** Green background, white text, rounded.  
- **Inactive:** Light grey background, dark grey text, same rounded shape.  
- No heavy border; flat look.

**Secondary / "Submit offer"**  
- Same green style as primary but only as wide as needed (e.g. right side of list row).

---

## 5. Header

- **Background:** White.  
- **Left:** Back arrow `<` when needed (dark grey or dark blue).  
- **Center (customer app):** Logo "Fixa2an" – "Fixa" dark blue, "2an" green with small green checkmark on "2".  
- **Alternative (workshop/admin):** Logo on left, hamburger (three lines) on right.  
- **Height:** Comfortable tap area; consistent with status bar.

---

## 6. List rows (offers, workshop inbox, admin customers)

**Offer card (customer offers list)**  
- Left: **Circular avatar** – dark blue circle, white initials (e.g. "VA", "BI").  
- Middle: Workshop name (bold), price (bold, prominent), distance (small, grey), "Fixa2an Certified" (green check + text), star rating (yellow stars).  
- Right: Green "Select" button, rounded.  
- Card: white, rounded, subtle shadow/border, good padding.

**Workshop inbox row**  
- Vehicle (bold), problem (regular below).  
- Secondary line: "X km away • Latest [date]" (small, grey).  
- Right: Green "Submit offer" button.

**Admin customer row**  
- Name (bold, dark blue).  
- City below (lighter grey).  
- Right: Grey chevron `>`.

---

## 7. Stats cards (workshop dashboard)

- **Layout:** Three equal-width cards in a row.  
- **Style:** White, rounded corners, very subtle shadow or light border.  
- **Content per card:** Icon (blue or green) on top, then number/value (large, bold), then label (small, grey).  
- **Icons:** Simple, flat (e.g. chevron for inquiries, check for won jobs, dollar for revenue).

---

## 8. Admin 2×2 grid

- Four large tap areas: Customers, Workshops, Requests, Revenue.  
- Each: icon (blue or green) above, label below (dark blue).  
- Same card style: white, rounded, subtle border/shadow.  
- Icons: person (blue), building (green), document (blue), coins/dollar (green).

---

## 9. Bottom navigation (workshop)

- **Bar:** White background, full width, fixed bottom.  
- **Items:** Icon above label. Four items: Inbox, My jobs, Statistics, Account.  
- **Active:** Blue icon + blue text.  
- **Inactive:** Dark grey icon + dark grey text.  
- Simple, flat icons (inbox, list/doc, bar chart, person).

---

## 10. Spacing & layout

- **Screen padding:** Consistent horizontal padding (e.g. 16–24px).  
- **Between sections:** Clear vertical gap (e.g. 24–32px).  
- **Between cards:** 12–16px.  
- **Inside cards:** 16–20px padding.  
- **Whitespace:** Generous; avoid cramped blocks.  
- **Alignment:** Main content left-aligned; numbers/prices can be right-aligned in breakdowns and lists.

---

## 11. Icons

- **Logo:** Green checkmark integrated with "2" in "2an".  
- **Certification:** Green circle with white check.  
- **Stars:** Five yellow filled stars for rating.  
- **List/CTA:** Camera (white on green), envelope, calendar, etc.  
- **Style:** Simple, flat, consistent weight. (Lucide works well.)

---

## 12. Summary – Tailwind-style tokens to use

- **Navy (headings, primary text):** `#05324f` → `text-brand-navy`, `bg-brand-navy` for icons.  
- **Green (CTA, active, accent):** `#34C759` → `bg-brand-green`, `text-brand-green`.  
- **Cards:** `bg-white rounded-xl border border-gray-200` or `shadow-sm` (very light).  
- **Filter pill active:** `bg-brand-green text-white rounded-full px-4 py-2`.  
- **Filter pill inactive:** `bg-gray-100 text-gray-600 rounded-full px-4 py-2`.  
- **Primary button:** `bg-brand-green text-white font-bold rounded-xl py-3 px-6` (and full width on mobile where needed).  
- **Avatar (initials):** `bg-brand-navy text-white rounded-full flex items-center justify-center` with initials inside.  
- **Stars:** `text-yellow-500`.  
- **Section title:** `text-brand-navy font-bold text-lg` (or `text-xl` for page title).

Use this doc when changing pages so the UI matches the reference styling (colors, typography, cards, buttons, spacing).
