# Vastra — Saree E-commerce Storefront

A full-stack saree storefront: **React (Vite + Tailwind)** frontend and a **Node.js/Express + PostgreSQL (Prisma) + Razorpay** backend.

```
saree-store/
├── backend/     # Express API, Prisma schema, Razorpay integration
└── frontend/    # React storefront (Vite + Tailwind)
```

## What's included

- Product catalog with category/fabric/occasion/price filters, search, sort, pagination
- Product detail pages with image gallery, related "You may also like" products
- Cart (persisted to localStorage) and guest checkout — no account required
- Customer accounts: signup/login, saved addresses, order history, checkout auto-fill
- Checkout with server-side price validation + Razorpay payment (UPI/cards/netbanking), live field validation
- Server-side payment signature verification + webhook for reliable confirmation (never trust client-side "success" alone)
- Order confirmation page, order status tracking
- Admin panel: product/category management with image upload, order management, dashboard
- Order notifications via email/SMS/WhatsApp (all optional, independently configured)
- httpOnly-cookie sessions, brute-force lockout, tightened CSP — see Security section
- Reusable component library, security middleware (helmet, rate limiting, CORS, compression), centralized error handling
- Mobile-friendly throughout (storefront and admin)

---

## 1. Local setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (see step 2 for a free hosted option)
- A free [Razorpay](https://razorpay.com) account (test mode works with no KYC)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL and RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                          # adds sample categories + sarees
npm run dev                           # starts API on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL and VITE_API_ORIGIN default to localhost — fine for local dev.
# Both must always be set together (see the Security section below for why).
npm install
npm run dev                           # starts app on http://localhost:5173
```

Open http://localhost:5173 — you should see the storefront with seeded sarees.

### Get Razorpay test keys
1. Sign up at https://dashboard.razorpay.com/signup
2. Go to **Settings → API Keys → Generate Test Key**
3. Copy the Key ID and Key Secret into `backend/.env`
4. Test payments use Razorpay's [test card/UPI details](https://razorpay.com/docs/payments/payments/test-card-upi-details/) — no real money moves in test mode

---

## 2. Budget-friendly deployment

This stack costs **₹0/month** to start (all free tiers), scaling only when you get real traffic.

| Layer | Service | Free tier |
|---|---|---|
| Database | [Neon](https://neon.tech) (serverless Postgres) | 0.5 GB storage, generous compute — free forever tier |
| Backend API | [Render](https://render.com) | Free web service (spins down after 15 min idle, ~30s cold start) |
| Frontend | [Vercel](https://vercel.com) | Free hobby tier, fast global CDN |

> If Render's cold-start delay bothers you later, Render's paid tier starts at $7/mo, or consider [Railway](https://railway.app) (~$5/mo usage-based) which doesn't sleep.

### Step 1 — Database on Neon
1. Sign up at https://neon.tech, create a project (choose a region close to your users, e.g. Mumbai/Singapore)
2. Copy the connection string it gives you (starts with `postgresql://...?sslmode=require`)
3. Save it — you'll paste it into Render as `DATABASE_URL`

### Step 2 — Backend on Render
1. Push this repo to GitHub
2. In Render: **New → Web Service**, connect your repo, set **Root Directory** to `backend`
3. Render will detect `render.yaml` — or set manually:
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start command: `npm start`
4. Add environment variables in Render's dashboard:
   - `DATABASE_URL` → your Neon connection string
   - `NODE_ENV` → `production`
   - `CLIENT_URL` → your Vercel URL (add after step 3, e.g. `https://vastra.vercel.app`)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` → from Razorpay dashboard (use **live** keys once you complete Razorpay KYC for real payments)
5. Deploy. Once live, run the seed once via Render's shell tab: `npm run seed`

### Step 3 — Frontend on Vercel
1. In Vercel: **New Project**, import the same repo, set **Root Directory** to `frontend`
2. Framework preset: Vite (auto-detected)
3. Add **both** of these environment variables (both required together — see the ⚠️ warning below):
   - `VITE_API_URL` → `https://<your-render-service>.onrender.com/api`
   - `VITE_API_ORIGIN` → `https://<your-render-service>.onrender.com` (same URL, but **no** `/api` at the end, **no** trailing slash)
4. Deploy. Vercel gives you a URL like `https://vastra.vercel.app`
5. Go back to Render and update `CLIENT_URL` to that Vercel URL, then redeploy the backend (needed for CORS to allow requests)

> ⚠️ **`VITE_API_ORIGIN` is not optional.** It's used to build the site's Content-Security-Policy, which tells the browser which servers the page is allowed to talk to. If it's missing, the browser will silently **block every API call** (products won't load, checkout won't work) because the security policy won't include your real backend as an allowed destination. If your deployed site suddenly shows no products or a blank page after a deploy, this is the first thing to check — open the browser console, and a CSP violation will say so explicitly.


### Step 4 — Go live with real payments
1. Complete Razorpay KYC (business details, bank account) — required before accepting real money
2. Switch `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in Render to your **live** keys
3. (Optional but recommended) Point a custom domain at Vercel (Vercel → Domains) — Vercel issues free SSL automatically

### Costs as you grow
- Neon free tier covers a few thousand products/orders comfortably; upgrade (~$19/mo) only once you outgrow it
- Render free tier is fine for early traffic; the main downside is the cold-start delay on the first request after idling
- Vercel free tier easily handles moderate traffic for a storefront

---

## 3. Admin Panel

Manage products and orders through a web UI instead of editing the database directly.

**Setup (one-time):**
1. Choose an admin password, then generate its hash:
   ```powershell
   cd backend
   node scripts/hash-password.js "your-chosen-password"
   ```
2. Copy the printed `ADMIN_PASSWORD_HASH="..."` line into `backend/.env`
3. Set `ADMIN_EMAIL` in `backend/.env` to whatever email you want to log in with
4. Generate a random `JWT_SECRET` (used to sign admin login sessions):
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Paste the output into `JWT_SECRET` in `backend/.env`
5. Restart the backend (`npm run dev`)

**Using it:**
- Go to `http://localhost:5173/admin/login` and log in with the email/password you set above
- **Dashboard** — quick totals: products, paid orders, revenue, low-stock count
- **Products** — add/edit/delete sarees, with image upload (pick a category first, then upload photos — they're automatically saved into that category's folder; compress them before uploading, see the Performance section below)
- **Orders** — view all orders, filter by status, open one to see items/customer/address and update its status (e.g. mark Shipped/Delivered)

**Notes:**
- This is a single-admin-account system by design (no separate signup, no multi-user roles) — appropriate for a single-owner store. If you later need multiple staff logins, that's a bigger change (a real `AdminUser` table) — ask if you want that built.
- Deleting a product that has past orders isn't allowed (it would break order history) — the panel automatically sets its stock to 0 instead, which hides it from the storefront while preserving your order records.
- On Render's free tier, uploaded images live on an ephemeral filesystem and can be lost on redeploy — for anything beyond casual testing, consider moving to Cloudinary/S3 for uploaded images (ask if you want this wired in).

## 4. Reliable Payment Confirmation (Webhook)

Previously, an order was only marked "PAID" when the customer's own browser called your server right after Razorpay's popup closed. If their internet dropped or they closed the tab in that split second, Razorpay would have their money but your database would still show "PENDING."

**This is now fixed with a Razorpay webhook** — Razorpay's servers call your backend directly to confirm payment, independent of the customer's browser. Set it up once:

1. In your Razorpay Dashboard: **Settings → Webhooks → Add New Webhook**
2. **Webhook URL:** `https://your-backend-url.onrender.com/api/webhooks/razorpay`
3. **Active events:** check `payment.captured` and `payment.failed`
4. Razorpay will show you a **Webhook Secret** — copy it
5. In `backend/.env` (and in Render's environment variables once deployed), set:
   ```
   RAZORPAY_WEBHOOK_SECRET="paste-the-webhook-secret-here"
   ```
6. Restart the backend

This is safe to run alongside the existing browser-based confirmation — whichever one arrives first (browser or webhook) processes the order; the other is automatically ignored, so stock is never decremented twice and notifications are never sent twice, even if both happen to fire at almost the same moment.

## 5. Order Notifications (Email, SMS, WhatsApp)

When an order is confirmed as paid, the store can automatically notify **both the customer and you (the admin)** by email, SMS, and WhatsApp. Every channel is optional and independent — configure any combination (or none) and the store works fine either way; unconfigured channels are just silently skipped.

### Email (via Resend)
1. Sign up free at https://resend.com
2. Get an API key from the dashboard
3. In `backend/.env`:
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   RESEND_FROM_EMAIL="orders@yourdomain.com"
   ```
   For quick testing without owning a domain yet, Resend provides a shared testing address (check their dashboard for the current one) — but for real customer emails, verify your own domain in Resend (their dashboard walks you through the DNS records).
4. Optionally set `ADMIN_NOTIFY_EMAIL` if you want admin alerts to go somewhere other than your `ADMIN_EMAIL` login address.

### SMS + WhatsApp (via Twilio)
1. Sign up at https://twilio.com (free trial includes credit)
2. Get your **Account SID** and **Auth Token** from the Twilio Console
3. Buy/activate a Twilio phone number for SMS
4. In `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_SMS_FROM="+1xxxxxxxxxx"
   TWILIO_WHATSAPP_FROM="+14155238886"
   ADMIN_NOTIFY_PHONE="9876543210"
   ```

**Important trial-account limits to know about (not a bug — this is how Twilio works):**
- A **trial** Twilio account can only send SMS/WhatsApp to phone numbers you've manually verified in the Twilio Console. Fine for testing your own number; you'll need to upgrade to a paid Twilio account (pay-as-you-go, quite cheap per message) before it can message real customers.
- Twilio's **WhatsApp sandbox** (the default `+14155238886` number) requires each recipient to first send "join `<your-sandbox-code>`" to that number once. This is fine for testing but not usable for real customers — for production WhatsApp messaging, you'd need to apply for a WhatsApp Business Sender through Twilio, which involves Meta's business verification process (takes some days, is a separate approval step).

**Practical recommendation:** start with email only (Resend is simple and works for real customers immediately with no waiting period). Add SMS once you've upgraded Twilio past trial. Treat WhatsApp as a later addition once you're ready for Meta's business verification — it's the most valuable channel for Indian customers but also the slowest to set up properly.

## 6. Category Management

You can now add new saree categories directly from the admin panel — no code or database editing needed:

- Go to **Admin → Categories**
- Type a name (e.g. "Tussar Silk") and click **Add Category** — its URL slug and image folder are created automatically
- The new category immediately appears in the category dropdown when adding/editing products

## 7. Video Hero Banner

The homepage hero now plays a short looping video instead of a static image (it still shows the static image as a poster/fallback while the video loads or if video can't play). A placeholder video ships at `frontend/src/assets/videos/hero-banner.mp4` — replace it with your own footage:

- Keep it short (3-8 seconds is plenty for a looping banner) and under a few MB — a huge video file will hurt load speed just like an oversized photo would
- Recommended format: MP4 (H.264), no audio needed (it plays muted anyway)
- Same filename, or update the import path in `frontend/src/pages/Home.jsx`

## 8. Mobile-Friendly Storefront & Admin

- **Shop page filters** now open in a slide-up drawer on mobile (tap "Filters") instead of a cramped sidebar stacked above products
- **Admin panel** sidebar collapses into a hamburger menu on mobile, and forms/tables reflow to a single column
- **Product pages** show a sticky Add to Cart / Buy Now bar on mobile so it's always reachable while scrolling
- **"You may also like"** related products now appear at the bottom of each product page (same category, excluding the current item)

## 9. Wishlist & Search

**Wishlist** — tap the heart icon on any product card or product page to save it. Saved items live at `/wishlist`, with a "Move to cart" or "Remove" option on each. This is stored in the browser (like the cart), not tied to an account — works immediately for anyone, no login required. (A natural upgrade later: sync wishlist to the account for logged-in customers so it follows them across devices — ask if you want that built.)

**Search** — a search bar in the navbar (desktop: always visible; mobile: tap the magnifying glass) searches product name, description, and fabric, and takes you to `/shop?search=...` with results. Works alongside category/fabric/occasion filters — search for "silk" and then narrow by category, for example.

## 10. Customer Accounts

Customers can now create an account, save addresses, and view order history — while guest checkout (no account needed) still works exactly as before.

**What's included:**
- Sign up / log in at `/signup` and `/login`
- `/account` — edit name/phone, change password
- `/account/addresses` — save multiple addresses, mark one as default, edit/delete
- `/account/orders` — full order history for the logged-in customer
- At checkout, a logged-in customer's default address auto-fills the form, and they can switch between any saved address from a dropdown
- Guests see a "Log in for faster checkout" prompt but can dismiss it and check out without an account — nothing is forced

**How it works technically:** customer sessions use the same httpOnly-cookie pattern as the admin panel (see the Security section below) rather than storing a token in localStorage — meaningfully more resistant to theft via any future XSS bug. Placing an order while logged in automatically links that order to the account (via the session cookie); placing one as a guest works identically to before, just without the account link.

**Setting up locally:** no extra configuration needed beyond what's already in your `.env` — this reuses your existing `JWT_SECRET` and `DATABASE_URL`. Just run the Prisma migration below to create the new tables:
```powershell
cd backend
npx prisma migrate dev --name add_user_accounts
```

## 11. Reviews, Coupons, PDF Invoices, Gift Wrap, Wholesale & Custom Theme

A large batch of features, all fully working end to end:

**Product reviews & ratings** — logged-in customers can rate/review any product from its page; "Verified purchase" is computed server-side (checked against real paid orders, can't be faked). Average rating recalculates automatically. Moderate reviews at **Admin → Reviews**.

**Coupon codes** — create percentage or fixed-amount codes at **Admin → Coupons**, with optional minimum order value, max discount cap, usage limits, and expiry. Customers enter a code at checkout; the discount shown there is computed by the exact same server logic checkout itself enforces, so what they see always matches what they're charged — a client can never submit a fake discount amount.

**PDF Invoices** — every paid order gets a downloadable PDF invoice (branded, itemized, includes any discount/gift-wrap line items). Available from the order confirmation page, **My Account → Orders**, and **Admin → Orders**.

**Gift wrap** — a checkbox at checkout (+₹49) with an optional gift note, shown on the invoice and to admin — useful since sarees are commonly gifted.

**Wholesale/bulk inquiries** — a form at `/wholesale` (linked in the footer) for boutiques/resellers to reach out; submissions email you and are listed at **Admin → Wholesale Inquiries**.

**Customizable theme** — go to **Admin → Settings** to switch the entire site's color palette between three presets: **Royal** (maroon & gold, the original), **Purple & White**, and **Pink & White**. Changes preview live as you click, and "Save" makes it permanent for every visitor — no code change or redeploy needed. Under the hood this uses CSS custom properties rather than hardcoded colors, so it's a real runtime switch.

**Wishlist now syncs to accounts** — previously browser-only; a logged-in customer's wishlist now follows them across devices (guest wishlist items are automatically merged in on login).

## 12. Security Hardening (Admin & Customer Sessions)

Three meaningful upgrades over the original implementation, all now in place:

**1. httpOnly cookie sessions (both admin and customer logins)**
Previously, the admin login token was stored in `localStorage`, which is readable by any JavaScript running on the page — meaning a single XSS bug anywhere in the app could let an attacker steal a live admin session. Both admin and customer sessions now live in httpOnly cookies instead: **not even your own frontend code can read the token**, which is precisely what makes it resistant to theft this way. The browser sends it automatically; your React code never touches it directly.

*Deployment note:* this requires `CLIENT_URL` in `backend/.env` (and on Render) to be the **exact** frontend origin — no wildcards, no trailing slash — since cross-site cookies require it. Already documented in the deployment steps above, but worth re-checking if login stops working after a redeploy.

**2. Tightened Content-Security-Policy**
`frontend/index.html` now ships a CSP that restricts the page to only loading scripts/styles/connections from trusted sources (itself, Google Fonts, and Razorpay). Even if an XSS bug slipped past everything else, the browser itself would block an injected `<script>` tag or an unexpected request to an attacker's server. This required adding a new required env var — see the ⚠️ warning in the deployment section above (`VITE_API_ORIGIN`), which the CSP needs to know your real backend's address.

**3. Brute-force lockout + email alert**
Both admin and customer logins now lock out after 5 failed attempts within 15 minutes (separate from, and stricter than, the general rate limiter, which only slows requests but doesn't lock the account). On admin accounts specifically, crossing that threshold also sends you an email alert (reuses your existing Resend setup from Section 5 — no extra config).

**Also fixed while reviewing this area:**
- Customer-entered checkout fields (name, address) are now HTML-escaped before being embedded in notification emails — previously a malicious "customer" could have injected raw HTML/scripts into the emails sent to you.
- Order numbers (used as a public "receipt lookup" key for guest order confirmation, no login required) now use a cryptographically random 8-character suffix instead of a guessable 4-digit one — makes enumerating other customers' order details impractical.

## 13. Performance — read this before running Lighthouse

**If you got a low Lighthouse score (e.g. ~30), you almost certainly tested `http://localhost:5173` while `npm run dev` was running.** Vite's dev server is intentionally unminified, unbundled per-module, and keeps a live-reload WebSocket open — it is *never* representative of real-world performance. Always test the **production build**:

```powershell
cd frontend
npm run build
npm run preview
```
Then run Lighthouse against the URL `npm run preview` gives you (usually `http://localhost:4173`) — not port 5173. Scores in the 90s are typical for this codebase once you do this.

**Other performance work already built in:**
- Backend responses are gzip-compressed (`compression` middleware) — cuts JSON/HTML/CSS/JS transfer size significantly
- The homepage loads all categories + their products in a **single** API call (`GET /api/home`) instead of one request per category
- Product images are lazy-loaded (`loading="lazy"`) except the above-the-fold hero/logo, which load eagerly with `fetchPriority="high"` for a faster Largest Contentful Paint
- Static images are served with 7-day cache headers

**The #1 thing YOU control that affects speed: your photo file sizes.** A phone camera photo can be 4–8 MB — that alone can tank both load time and Lighthouse score, no amount of code optimization fixes that. Before uploading real product photos:
- Resize to ~1200–1500px on the longer edge (a saree photo doesn't need to be 4000px wide for the web)
- Compress to roughly 100–300 KB per image (JPEG quality ~75–85 is usually visually lossless)
- Free tools: [squoosh.app](https://squoosh.app) (drag and drop, no install) or `npx sharp-cli` if you're comfortable with the command line

The placeholder images this project ships with (`backend/scripts/generate-placeholder-images.js` output) are deliberately kept in that same 20–30KB range as a size target to match.

## 14. Fixed: Razorpay scripts running after payment

Previously, after a successful payment the app used client-side routing (`navigate()`) to move to the order confirmation page. Razorpay's checkout SDK injects iframes and background listeners into the page for fraud detection — since a single-page app never actually reloads the document on a route change, those kept running indefinitely, even after navigating elsewhere.

**Fix applied:** on successful payment, the app now calls `rzp.close()` and then does a **full browser navigation** (`window.location.href`) to the order confirmation page instead of a client-side route change. This guarantees the browser tears down everything Razorpay injected, exactly like closing and reopening a tab would. You shouldn't see any lingering network activity in DevTools after this.

## 15. Adding your own saree photos

Product images live under `backend/public/images/products/<category-slug>/` and are served automatically by the backend at `/images/products/...` — no code changes needed.

**To use real photos:**
1. Take/prepare photos for a saree (JPG recommended). **Resize to ~1200-1500px wide and compress to ~100-300KB** — see the Performance section above, this matters a lot for load speed
2. Drop them into the matching category folder, e.g. `backend/public/images/products/kalanjali-paithani/`
3. Update the `images` array for that product in `backend/prisma/seed.js` to point at your filenames, e.g.:
   ```js
   images: ["/images/products/kalanjali-paithani/my-new-saree-1.jpg", "/images/products/kalanjali-paithani/my-new-saree-2.jpg"],
   ```
4. Re-run `npm run seed` in the `backend` folder to update the database

The category folders (`kalanjali-paithani`, `maheshwari-cotton`, `chiffon-georgette`, `cotton-handloom`, `party-wear`) match the seeded categories — add a new folder if you add a new category.

Out of the box, `backend/scripts/generate-placeholder-images.js` fills these folders with simple colored placeholder images so the site isn't empty while you gather real photography. Delete/overwrite them with real photos any time.

**Logo and hero banner:** `frontend/src/assets/icons/ovee4.png` (navbar logo) and `frontend/src/assets/images/BrandImage.jpeg` (homepage hero) currently ship as small placeholder graphics so the project builds out of the box. Replace those two files with your real logo/banner (same filenames, or update the import paths in `Navbar.jsx` / `Home.jsx`) — again, keep them reasonably compressed (a logo PNG under ~50KB, a hero JPEG under ~200KB is plenty).

**When deploying:** Render's free tier has an ephemeral filesystem — files you upload directly on the server can disappear on redeploy. For production, either commit your image files to the repo (fine for a modest catalog) or move to a proper image host like Cloudinary/ImageKit/S3 and store full URLs in the `images` array instead of local paths (the frontend already supports both — see `frontend/src/utils/image.js`).

## 16. Extending this later

Some natural next additions — say the word and I'll build any of these:
- **Abandoned cart email reminders**
- **Multiple admin/staff logins** with roles, if one shared login stops being enough
- **Cloud image storage** (Cloudinary/S3) so uploaded photos survive redeploys on free hosting tiers
- **Password reset via email** ("forgot password" flow) — not yet built for either admin or customer accounts; currently a forgotten password requires manually resetting via `scripts/hash-password.js` (admin) or direct DB access (customer)

**Before you launch:** `frontend/src/components/layout/Footer.jsx` has placeholder Instagram/WhatsApp links (`SOCIAL_LINKS` near the top of the file) — swap in your real handles/number.

## 17. Notes on the sample data

`backend/prisma/seed.js` ships with simple generated placeholder images (see Section 3 above). Replace them with your real product photography before launch — ideally hosted on a CDN/image service (Cloudinary, ImageKit, or S3 + CloudFront) rather than committed to your repo, once your catalog grows.
