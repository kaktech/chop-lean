# Prompt for Claude Code

Copy everything below the line into Claude Code, run from the folder that contains this handoff package.

---

You are building **Chop Lean**, a production-quality, full-stack e-commerce store for a Lagos weight-loss meal plan kitchen. This is my **HNG15 Lesson 2 individual task**, which requires:

1. A website for a shop, with a **checkout page**.
2. **Everything persisted in a database** using **Supabase or Neon** (Postgres).
3. **Confirmation emails sent with Mailgun.**
4. **Google sign-in set up through Google Cloud Console** (OAuth client ID and secret).

It must look and behave exactly like the design in this folder. It must not be a static or basic site: real data, real auth, real emails, real cart and checkout, admin dashboard, smooth animations, and fully responsive.

## Read these first (in this order)

1. `DESIGN.md`: tokens, fonts, signature elements, animations, responsive rules, screen-to-route map, image map.
2. `screenshots/*.png`: the visual target for every screen (desktop 1440px, mobile 390px). Look at each one before building that page.
3. `preview/*.html`: the same screens as working HTML (open them; hover states and animations play).
4. `design-source/*.dc.html`: exact inline styles and copy. `{{x}}` placeholders are filled from the data in each file's `<script>` block.
5. `seed/menu.json`: all plans, meals, drinks, weekly menu, delivery zones and promo codes.
6. `public/images/`: every photo, already named. Copy them into the app's `public/images/`.

## Tech stack (use exactly this)

- **Next.js 15, App Router, TypeScript, Tailwind CSS v4**, server components and server actions.
- **Database:** Postgres on **Supabase** (or Neon; make it work with either `DATABASE_URL`). ORM: **Drizzle** with migrations in `drizzle/`. Seed script `pnpm db:seed` that loads `seed/menu.json`.
- **Auth:** **Auth.js (NextAuth v5)** with the **Google provider** and the Drizzle adapter (sessions stored in the DB). Credentials come from **Google Cloud Console** (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`).
- **Email:** **Mailgun** via `mailgun.js` (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, and `MAILGUN_REGION`, which is `us` or `eu`). Build the templates with **React Email** so they match the design (see the email preview in `screenshots/Success.png`).
- **Payments:** **Paystack** in test mode for cards (`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`), plus bank transfer and pay on delivery. Verify card payments server-side and with a webhook (`/api/webhooks/paystack`, check `x-paystack-signature`).
- **Storage:** Supabase Storage bucket `product-images` for admin photo uploads and transfer receipts.
- **Animations:** `motion` (Framer Motion) for whileInView reveals, the drawer, bottom sheet and toast; CSS keyframes from `design-source/animations.css` for the marquee, float and spin.
- **UI helpers:** `lucide-react` icons, `sonner` for toasts (styled like the design), `zod` + `react-hook-form` for forms, `zustand` (persisted) for the guest cart.
- **Fonts:** `next/font/google`: Outfit, DM Sans, DM Serif Display (regular + italic).
- **Deploy:** Vercel. Package manager: pnpm.

## Data model (Drizzle)

`users`, `accounts`, `sessions`, `verification_tokens` (Auth.js) · `profiles` (user_id, phone, sex, age, height_cm, start_weight_kg, goal_weight_kg, activity, daily_kcal_target, exclusions text[], pepper_level) · `categories` · `products` (id, slug, type plan|meal|drink, name, description, image, gallery text[], kcal, protein_g, carbs_g, fat_g, price_kobo, compare_at_kobo, badge, tags text[], meals_per_day, days_per_week, weekly_slots, is_live) · `plan_calorie_options` (product_id, kcal, price_kobo) · `weekly_menus` (week_of) · `weekly_menu_items` (menu_id, day, slot, meal_id) · `carts` / `cart_items` (product_id, qty, options jsonb) · `orders` (id, number `CL-10482` style, user_id nullable, email, first_name, last_name, phone, zone_id, address, delivery_date, delivery_window, notes, subtotal_kobo, discount_kobo, delivery_kobo, pod_fee_kobo, total_kobo, payment_method card|transfer|pod, payment_status pending|awaiting_confirmation|paid|failed, status pending_payment|cooking|out_for_delivery|delivered|cancelled, promo_code, created_at) · `order_items` (order_id, product_id, name, qty, unit_price_kobo, options jsonb) · `payments` (order_id, method, amount_kobo, status, provider_ref, receipt_url) · `delivery_zones` · `promo_codes` · `reviews` (product_id, user_id nullable, order_id nullable, rating, body, fullness, pepper, weight_change, name, email, verified, is_visible) · `weight_logs` (user_id, kg, logged_on) · `newsletter_subscribers` · `store_settings` (bank_name, account_number, account_name, theme, setup flags).

Store money in kobo (integers). **Always recalculate prices, discounts, delivery and totals on the server**; never trust the client.

## Pages and features (match the screenshots)

**Global:** announcement bar; header with logo, pill search (searches products by name and tag), weight-tracker, cart (live count badge with pop animation), Google sign-in or avatar; nav row; footer with newsletter (saves to DB) and health disclaimer. Mobile: sticky header, bottom tab bar, menu drawer (`Menu.png`).

1. **Home `/`:** exactly as `Main.png` / `MHome.png`: angled green hero with `hero-wide.jpg` (`hero-tall.jpg` on mobile), staggered text animation, wipe-in photo, floating chips, rotating badge; dish marquee; how it works; shop by goal; this week's plans (from DB); offers bento; "Same jollof. Half the oil." section; new on the menu (from DB, "+ Add" adds to cart with toast); kitchen-to-gate photos; reviews block (real reviews only, placeholders when empty).
2. **Quiz `/quiz`:** steps (goal, about you, exclusions, pepper level). Calculate BMR with Mifflin-St Jeor × activity factor, subtract a 500 kcal deficit for weight loss, clamp to a 1,200 kcal minimum, round to the nearest plan (1200/1400/1600/1800). Show the target, weekly pace and protein, and recommend a plan. Save to `profiles` if signed in (otherwise to localStorage, synced after sign-in). Show the medical note.
3. **Shop `/shop`:** green banner with tabs (Plans / Single Meals / Drinks), filter sidebar (calories, goal, diet tags, meals per day) as URL search params, active-filter chips, sort, product grid with hover lift + zoom, pagination. Mobile: filter bottom sheet and 2-column grid.
4. **Product `/plans/[slug]` and `/meals/[slug]`:** gallery with thumbnails (crossfade), macro tiles, calorie selector that changes the price, meals per day, days, first delivery date (only Mon/Wed/Fri after the 6pm cutoff, Africa/Lagos), exclusions text, week quantity stepper, **Add to Cart → "Item added to cart" toast + slide-in cart drawer** (bottom sheet on mobile), "Subscribe and save 10%", share links (WhatsApp, X, copy). **This week's menu** from `weekly_menus` (5-column grid desktop, day tabs mobile, "Swap" opens similar-kcal options). Accordions. Reviews section: average and count, rating scales, "What customers are saying" summary (show only when ≥ 5 reviews; generate a simple summary from review text or leave the placeholder copy), filter/sort, empty state, **Write a review** modal (`Review.png`) saved to DB; verified badge when the order ID + email match.
5. **Cart `/cart` + drawer:** line items with options, qty, edit/remove, tiger-nut upsell, promo code (validated server-side), subtotal. Guest cart in zustand + localStorage; signed-in cart in the DB; merge on sign-in.
6. **Checkout `/checkout`:** "Continue with Google" or guest; contact (Nigerian phone validation); delivery-zone radio cards from DB; delivery date chips and window; address textarea with the validation message **"Please provide a more detailed address"** (min length + must include an area); kitchen notes; summary with promo; **REVIEW ORDER → `/checkout/pay`**.
7. **Pay `/checkout/pay`:** method switch: **Card** (Paystack inline, then verify), **Bank transfer** (→ `/checkout/transfer/[orderId]` with account details from `store_settings`, copy buttons, 30-minute countdown, receipt upload, "I've sent the money" → awaiting state), **Pay on delivery** (first order only, +₦500). Failed card → `/checkout/failed`.
8. **Order confirmed `/order/[id]`:** as `Success.png`. Clear the cart.
9. **Emails (Mailgun):** (a) order confirmation to the customer (styled like the preview: items, totals, delivery details; for transfer orders include the bank details); (b) new-order alert to `ADMIN_EMAILS`; (c) payment-confirmed email; (d) a status-update email whenever an admin changes the order status. Send from server actions; log failures and never block checkout on email errors.
10. **Sign in `/signin`:** split layout with `signin.jpg`, Google button only.
11. **Account `/account`:** protected. Active plan card (next delivery, swap meals, pause next week before the Thursday 6pm cutoff), weekly weight log (saved to `weight_logs`), line chart (Recharts) with the target-pace dashed line, order history with status pills and Reorder.
12. **Admin `/admin/*`:** restricted to emails in `ADMIN_EMAILS` (middleware). Dashboard: KPIs, store setup progress ring, storefront theme cards, first-100-orders progress, **kitchen prep list** (sum of portions per dish for the next delivery day, with exclusion swaps), plan mix bars, recent orders with status dropdown (triggers email). Products: tabs, search, sold-out filter, **lock inventory** (sell out when weekly slots are full), live toggle, create/edit with image upload. Payments: confirm or reject transfers (confirm → order `cooking`, payment `paid`, email), payment log. Also a weekly menu builder.

## Quality bar

- Pixel-close to the screenshots at 1440px and 390px; check 768px too. No horizontal scroll on mobile.
- Every animation in `DESIGN.md` §3, and all of them disabled under `prefers-reduced-motion`.
- Loading skeletons, empty states, error states and a 404 in the brand style.
- Accessibility: semantic HTML, labels on every input, focus rings, alt text, 44px touch targets, 4.5:1 contrast.
- SEO: metadata per page, Open Graph image, product JSON-LD.
- Security: server-side price and promo checks, Zod validation on every server action, rate-limit the review and newsletter forms, Paystack webhook signature check, admin routes protected in middleware.
- Performance: `next/image` with sizes; Lighthouse ≥ 90 on mobile for home and product.
- Tests: Vitest for pricing, promo, calorie and cutoff logic; one Playwright happy path (browse → add to cart → checkout as guest with pay on delivery → confirmation).

## Deliverables

- The complete app, with a `.env.example` listing every variable above plus `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` and `NEXT_PUBLIC_SITE_URL`.
- `README.md` with step-by-step setup:
  - creating the Supabase project (or Neon) and running migrations and the seed;
  - Google Cloud Console: create the project, configure the OAuth consent screen, create an OAuth client ID (Web), and add the authorised origins and redirect URIs `http://localhost:3000/api/auth/callback/google` and `https://<your-vercel-domain>/api/auth/callback/google`;
  - Mailgun: add and verify the sending domain (or use the sandbox domain with authorised recipients), get the API key;
  - Paystack test keys and the webhook URL;
  - deploying to Vercel.
- Seeded demo data so the store looks full on first run.

## How to work

1. Make a plan and show it to me, then build in this order: project setup and design tokens → DB schema and seed → layout (header, footer, mobile tab bar) → home → shop → product + cart drawer → checkout + pay + emails → auth + account → admin → polish animations and responsive → tests → README.
2. After each page, compare it against its screenshot and fix the differences before moving on.
3. Commit after each step with a clear message.
4. Ask me only when you need a secret key or a decision you can't make from these files.
