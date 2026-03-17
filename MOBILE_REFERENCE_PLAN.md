# Mobile Reference Plan (English First)

This plan is based on the 6 reference images in `Reference picture For mobile/`. It describes how to align the app with those designs **in English first**, then keep Swedish via i18n.

---

## 1. Reference → App Mapping

| Ref # | Image | App page / flow | Role |
|-------|--------|------------------|------|
| **A** | Offers list (filter pills, cards, “Välj”) | `OffersPage.jsx` | Customer |
| **B** | Offer detail + price breakdown + “Boka verkstad” | `BookAppointmentPage.jsx` | Customer |
| **C** | “Mina ärenden” – ongoing, booked, history + upload CTA | `MyCasesPage.jsx` | Customer |
| **D** | Home – logo, “Fixa din tvåa direkt”, CTA, how it works | `HomePage.jsx` | All |
| **E** | Workshop – stats cards, “Offertinbox”, bottom nav | `WorkshopDashboardPage.jsx` + workshop nav | Workshop |
| **F** | Admin – 2×2 grid (Kunder, Verkstäder, etc.) + list | `AdminPage.jsx` (mobile view) | Admin |

---

## 2. English Copy (for reference screens)

All visible text should exist in **English** in `en.json` (and optionally in `sv.json` for Swedish). Below is the copy per screen.

### 2.1 Home (Ref D)

- **Main heading:** “Fix your vehicle inspection – fast, simple, secure”
- **Primary CTA:** “Photograph / Upload protocol” (with camera icon)
- **Feature list (with green checkmarks):**
  - “Quality-assured workshops”
  - “Free to use”
  - “Quick and easy”
- **Section title:** “How it works”
- **Steps:**
  1. “Photograph and upload inspection protocol.” (camera icon)
  2. “Get offers from workshops.” (envelope icon)
  3. “Choose workshop and book time.”

### 2.2 Your offers (Ref A)

- **Page title:** “Your offers”
- **Filter pills:** “Price” | “Distance” | “Rating” (one active, e.g. light green)
- **Per card:** Workshop avatar/initials, name, price (e.g. “3,900 kr”), “X km from you”, “Fixa2an Certified” (green check), star rating, button **“Select”**

### 2.3 Offer detail / Book workshop (Ref B)

- **Total:** “3,800 kr” (or equivalent)
- **Card title:** “Price breakdown”
  - “Labor cost: 2,800 kr”
  - “Material cost: 1,000 kr”
- **Provider card:** Name, city, “Fixa2an Certified”, rating (e.g. “4.7” + stars), small map
- **CTA:** “Book workshop”

### 2.4 My cases (Ref C)

- **Page title:** “My cases”
- **Section:** “Ongoing requests”
  - Card: “Waiting for offers” + link **“Show offer list”**
- **Section:** “Booked workshops”
  - Card: Workshop name, date/time, address + **“Show details”**
- **Section:** “History”
  - Card: Green check + “Approved”, date
- **Bottom CTA:** Camera icon + “Upload new protocol”

### 2.5 Workshop dashboard (Ref E)

- **Header:** Logo + hamburger (top right)
- **Stats row (3 cards):**
  - “New inquiries” + number (e.g. 3)
  - “Won jobs” + number (e.g. 5)
  - “Income” + amount (e.g. “45,000 kr”)
- **Section title:** “Offer inbox”
- **List items:** Vehicle (e.g. “Audi A4”), problem (e.g. “Defective parking light”), “X km away • Latest 2 May”, button **“Submit offer”**
- **Bottom nav (4 items):** “Inbox” | “My jobs” | “Statistics” | “Account”

### 2.6 Admin mobile (Ref F)

- **Header:** “Fixa2an Admin” (or “Fixa2an Admin panel”) + hamburger
- **2×2 grid:**
  - “Customers”
  - “Workshops”
  - “Requests”
  - “Revenue”
- **List section title:** “Customers”
- **List rows:** Name (e.g. “Emma Karlsson”), city (e.g. “Uppsala”), chevron right
- **Footer:** “Admin panel v1.0”

---

## 3. Layout / UI Changes (mobile-first)

### 3.1 Global (all mobile screens)

- **Header:** Back arrow where needed; center logo “Fixa2an” (green “2an” + check); no extra clutter.
- **Touch targets:** Buttons and links at least 44px height.
- **Cards:** Light borders, minimal or no shadow (per your preference); consistent rounded corners (e.g. 12px).
- **Spacing:** Comfortable padding (e.g. 16–24px) so layout matches reference density.

### 3.2 Home (Ref D)

- Single-column, centered.
- Logo then main heading then one primary green CTA (camera + “Photograph / Upload protocol”).
- Feature list: checkmark + short line per item.
- “How it works”: heading then 1–2–3 steps with icons (camera, envelope; third can be calendar or similar).
- No heavy shadows; optional light border on CTA.

### 3.3 Offers list (Ref A)

- One clear title: “Your offers”.
- Three filter pills in a row (Price, Distance, Rating); active = light green background.
- One card per offer: left = avatar + text block (name, price, distance, certified, stars), right = green “Select” button.
- Cards stack vertically; list scrollable.

### 3.4 Offer detail / Book (Ref B)

- Total price prominent at top.
- One card “Price breakdown” (labor + material).
- One card for workshop (name, city, certified, rating, map thumbnail).
- One full-width green CTA: “Book workshop” at bottom.

### 3.5 My cases (Ref C)

- Title “My cases”.
- Three sections: “Ongoing requests”, “Booked workshops”, “History”.
- Each section: heading then one or more simple cards (grey background, rounded); each card has a green text link (“Show offer list”, “Show details”).
- Sticky or fixed bottom CTA: camera + “Upload new protocol”.

### 3.6 Workshop (Ref E)

- Top: logo + hamburger.
- Three stat cards in a row (New inquiries, Won jobs, Income).
- “Offer inbox” title then list: each row = vehicle + problem, distance + deadline, green “Submit offer” button.
- Bottom navigation: 4 items (Inbox, My jobs, Statistics, Account); current page highlighted (e.g. blue).

### 3.7 Admin (Ref F)

- Top: “Fixa2an Admin” + hamburger.
- 2×2 grid of large tap areas (Customers, Workshops, Requests, Revenue) with icons.
- Below grid: “Customers” heading then a simple list (name, city, chevron).
- Footer: “Admin panel v1.0”.

---

## 4. Implementation Order

1. **Copy (English first)**  
   - Add/update all strings above in `Frontend/src/locales/en.json` under the right keys (e.g. `home`, `offers_page`, `my_cases`, `workshop`, `admin`).  
   - Use these keys in JSX so the app shows English by default; Swedish can mirror the same structure in `sv.json`.

2. **Home (Ref D)**  
   - Adjust `HomePage.jsx`: heading, one CTA, feature list, “How it works” steps with icons.  
   - Ensure mobile breakpoint (e.g. default or max 640px) matches reference layout.

3. **Offers list (Ref A)**  
   - In `OffersPage.jsx`: ensure title “Your offers”, filter pills (Price/Distance/Rating), and card layout (avatar, details, “Select”) match reference on small screens.

4. **Offer detail / Book (Ref B)**  
   - In `BookAppointmentPage.jsx`: total at top, price breakdown card, workshop card with map, “Book workshop” CTA.

5. **My cases (Ref C)**  
   - In `MyCasesPage.jsx`: sections “Ongoing requests”, “Booked workshops”, “History”; card layout and “Show offer list” / “Show details”; bottom “Upload new protocol” CTA.

6. **Workshop dashboard (Ref E)**  
   - In `WorkshopDashboardPage.jsx`: stats row, “Offer inbox” list, “Submit offer” buttons.  
   - Add or adjust workshop bottom nav (Inbox, My jobs, Statistics, Account) so it appears on workshop routes on mobile.

7. **Admin mobile (Ref F)**  
   - In `AdminPage.jsx`: for small viewport, show 2×2 grid and customers list as in reference; header “Fixa2an Admin” + hamburger; footer “Admin panel v1.0”.

8. **Polish**  
   - Remove or reduce shadows on cards/modals where you want the “no white shadow” look.  
   - Ensure all new copy is in `en.json` (and `sv.json` if you keep Swedish).

---

## 5. How I Can Apply These Changes

- **Step 1:** Add/update English (and optionally Swedish) keys in `en.json` / `sv.json` for all sections above.  
- **Step 2:** Update each page component (Home, Offers, Book appointment, My cases, Workshop dashboard, Admin) to use these keys and to follow the layout described in Section 3 for mobile.  
- **Step 3:** Add or adjust workshop bottom navigation and admin mobile layout so they match Ref E and F.  
- **Step 4:** Optional: add a simple “mobile layout” flag or use only breakpoints (e.g. Tailwind `sm:`/`md:`) so desktop stays as is and mobile matches the references.

If you tell me which screen to do first (e.g. “start with Home” or “do Offers and My cases”), I can apply the changes step by step in that order.
