# Vastra — Saree E-commerce Storefront

A full-stack saree storefront: **React (Vite + Tailwind)** frontend and a **Node.js/Express + PostgreSQL (Prisma) + Razorpay** backend.

```
saree-store/
├── backend/     # Express API, Prisma schema, Razorpay integration
└── frontend/    # React storefront (Vite + Tailwind)
```

## What's included

- Product catalog with category/fabric/occasion/price filters, search, sort, pagination
- Product detail pages with image gallery
- Cart (persisted to localStorage) — no login required, guest checkout
- Checkout with server-side price validation + Razorpay payment (UPI/cards/netbanking)
- Server-side payment signature verification (never trust client-side "success" alone)
- Order confirmation page
- Reusable component library, security middleware (helmet, rate limiting, CORS), centralized error handling

Not included yet (by your choice — storefront-only scope): admin panel, user accounts/login, reviews, wishlist. The `Order` and `Product` models are already structured so you can add these later without a redesign — just ask and I'll build them.

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
# VITE_API_URL defaults to http://localhost:5000/api — fine for local dev
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
3. Add environment variable: `VITE_API_URL` → `https://<your-render-service>.onrender.com/api`
4. Deploy. Vercel gives you a URL like `https://vastra.vercel.app`
5. Go back to Render and update `CLIENT_URL` to that Vercel URL, then redeploy the backend (needed for CORS to allow requests)

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

## 4. Performance — read this before running Lighthouse

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

## 5. Fixed: Razorpay scripts running after payment

Previously, after a successful payment the app used client-side routing (`navigate()`) to move to the order confirmation page. Razorpay's checkout SDK injects iframes and background listeners into the page for fraud detection — since a single-page app never actually reloads the document on a route change, those kept running indefinitely, even after navigating elsewhere.

**Fix applied:** on successful payment, the app now calls `rzp.close()` and then does a **full browser navigation** (`window.location.href`) to the order confirmation page instead of a client-side route change. This guarantees the browser tears down everything Razorpay injected, exactly like closing and reopening a tab would. You shouldn't see any lingering network activity in DevTools after this.

## 6. Adding your own saree photos

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

## 7. Extending this later

Some natural next additions — say the word and I'll build any of these:
- **User accounts** (signup/login, order history, saved addresses)
- **Search & filters** enhancements, wishlist, product reviews
- **Coupons/discounts**, abandoned cart emails
- **Email notifications** on order confirmation (e.g. via Resend or SendGrid)
- **Multiple admin/staff logins** with roles, if one shared login stops being enough
- **Cloud image storage** (Cloudinary/S3) so uploaded photos survive redeploys on free hosting tiers

## 8. Notes on the sample data

`backend/prisma/seed.js` ships with simple generated placeholder images (see Section 3 above). Replace them with your real product photography before launch — ideally hosted on a CDN/image service (Cloudinary, ImageKit, or S3 + CloudFront) rather than committed to your repo, once your catalog grows.
