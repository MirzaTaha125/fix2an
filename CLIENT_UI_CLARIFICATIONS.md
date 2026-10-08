# Fixa2an — UI / Product Clarifications

**To:** Client / Product Owner  
**From:** Development team  
**Subject:** Open questions before we finalize Del 1, Del 6 & Del 7  
**Date:** 24 September 2026  

---

Hi,

While implementing the Fixa2an UX according to the design boards (Del 1–10), a few flows need your confirmation. We don’t want to assume the wrong behaviour and rebuild later.

Please reply under each question (short answers are fine).

---

## 1. Del 1 — Create a case (Skapa ett ärende)  
### Guest / first-time user & email verification

In the create-case flow, the customer can start without being fully logged in (upload protocol / describe the problem → car & contact details → send request).

There is **no dedicated screenshot** in the UX PDF for what happens around email verification / magic link after they enter their email.

**Please confirm:**

1. When a new customer submits a case with their email, should they **first verify that email via magic link** (click link in inbox) before the request is actually sent to workshops?  
   - **Option A:** Yes — case is held until they click the magic link, then it goes live.  
   - **Option B:** No — case is sent immediately; magic link is only for later login / returning to the app.  
   - **Option C:** Something else (please describe).

2. If they are already logged in, do we skip magic-link verification completely?

3. If you have a preferred copy/screen for “Check your email” after create-case, please share it (or confirm we can use the same magic-link screen as Del 7 login).

---

## 2. Del 6 — Payment & review (Betalning & omdöme)  
### Payment method, keys, cash-at-workshop & platform commission

The mockups show a payment overview, receipt, then rating/review. We need clarity on how money actually moves.

**Important:** In the Del 6 UI boards, **platform commission is not mentioned anywhere** (no line item for the customer, no note for the workshop). We need you to confirm whether Fixa2an still earns commission on completed jobs, and how that works behind the scenes.

### 2.1 Payment provider

1. Which payment method should we integrate for in-app payment?  
   - Klarna  
   - Stripe  
   - Swish  
   - Other: _______________

2. Can you provide (or arrange access to) the **sandbox / live API keys** and any merchant account details for that provider?

3. Should payment happen **inside Fixa2an** (customer pays in the app, then we show receipt), or is the payment screen mainly a **cost summary** while the customer still pays the workshop by other means?

### 2.2 Cash / direct payment to the workshop

Some customers may pay the workshop **in cash or by card on site**, without using the app payment step.

1. What should the app show in that case?  
   - Customer marks “I paid at the workshop” and continues to review?  
   - Workshop marks the job as paid?  
   - Payment step is skipped entirely for cash?

2. Who is responsible for confirming that payment happened (customer, workshop, or both)?

### 2.3 Platform commission (not shown in the UI)

Because commission does not appear in the customer payment screens, please confirm the business rule:

1. **Does Fixa2an take a platform commission on each completed job?**  
   - **Yes**  
   - **No**  
   - **Only in some cases** (please describe)

2. If **yes**, what is the model?  
   - Fixed % of the job total (e.g. 10%) — please state the rate: ________%  
   - Fixed fee per booking  
   - Other: _______________

3. Who pays the commission — the **workshop** (settled later via invoice / wallet), or is it deducted automatically when the customer pays in-app?

4. If the customer pays the workshop **directly in cash / on site**, does the **platform still get commission**?  
   - **Yes** — workshop still owes Fixa2an commission (invoice / settlement later).  
   - **No** — commission only when payment goes through Fixa2an.  
   - **Other:** please explain.

5. Should commission ever be visible to the customer in the app, or stay **workshop/admin only** (as in the current UI)?

---

## 3. Del 7 — Account & help pages (Konto & hjälpsidor)  
### Same customer app vs separate portal

Del 7 shows login (magic link), account overview, my cars, settings, help/contact, FAQ, and policies — often in a more **web / desktop** layout with marketing header and footer.

**Please confirm:**

1. Is Del 7 the **same customer product** as the mobile app (one account, same data, responsive web + mobile), just shown in a wider layout?  
   - **Option A:** Same app / same portal — one codebase, responsive for mobile and web.  
   - **Option B:** Separate web portal (different entry URL / shell), sharing the same backend and user accounts.  
   - **Option C:** Separate product entirely (please clarify who uses it).

2. Should “My cars”, Settings, Help & FAQ live inside the existing **Profile** area of the customer app, or as their own main sections in the nav?

3. For guests who only used magic link once: is Del 7 login the **primary** way returning customers sign in going forward?

---

## How to reply

You can answer inline, e.g.:

- **1.1** → Option B  
- **2.1.1** → Stripe (+ keys via secure channel)  
- **2.3.1** → Yes, platform commission applies  
- **2.3.2** → 10% of job total, invoiced to workshop monthly  
- **2.3.4** → Yes, commission still applies on cash/on-site payments  
- **3.1** → Option A  

If anything is still undecided, tell us the temporary assumption you want us to build with so development can continue without blocking.

Thanks — once we have these answers we can lock the flows and avoid rework.

---

**Internal note (for us):** Until answers arrive, do not hard-wire a live payment provider. Do not assume commission is skipped on cash — Del 6 UI does not show commission, but the product may still charge workshops behind the scenes.  
