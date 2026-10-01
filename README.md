# Chop Lean

Calorie-counted Nigerian meal plans for Lagos: a full-stack store with a real checkout, Postgres storage, Google sign-in, Mailgun order emails, Paystack card payments, bank transfer, pay on delivery and an admin dashboard.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Drizzle ORM · Neon (or Supabase) Postgres · Auth.js v5 (Google) · Mailgun · Paystack · Vercel Blob · motion · pnpm.

The design source and screenshots from the handoff are in `design-source/`, `screenshots/` and `DESIGN.md` (the original handoff README is `docs-design-handoff.md`).

## HNG task checklist

| Requirement | Where |
|---|---|
| Shop website with a checkout page | `/shop`, `/plans/[slug]`, `/cart`, `/checkout`, `/checkout/pay` |
| Everything persisted in Neon/Supabase | `db/schema.ts` (users, products, orders, payments, reviews, carts, menus…) |
| Confirmation emails with Mailgun | `lib/email.ts`, `lib/notify.ts`, `emails/*.tsx` |
| Google auth via Google Cloud Console | `auth.ts`, `/signin` (steps below) |

## 1. Run it locally

```bash
pnpm install
cp .env.example .env.local      # then fill it in (sections below)
pnpm db:migrate                 # creates the tables
pnpm db:seed                    # loads plans, meals, weekly menu, zones, CHOPLEAN20
pnpm dev                        # http://localhost:3000
```

Other scripts: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm db:generate` (new migration after editing `db/schema.ts`).

The app starts with only `DATABASE_URL` and `AUTH_SECRET` set. Anything not configured degrades gracefully: emails are logged and skipped, card payment shows "not switched on", Google sign-in shows a setup notice.

## 2. Database: Neon (or Supabase)

**Neon:** create a project at <https://console.neon.tech> (or Vercel → Storage → Create Database → Neon). Copy the **pooled** connection string into `DATABASE_URL`. Then run `pnpm db:migrate && pnpm db:seed`.

**Supabase instead:** create a project, then Project Settings → Database → Connection string (use the *Transaction pooler*), and use it as `DATABASE_URL`. The Drizzle migrations are plain Postgres, so they run unchanged. If you use Supabase, swap `db/index.ts` to `drizzle-orm/postgres-js` with the `postgres` package (Neon's HTTP driver only talks to Neon).

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

## 3. Google sign-in (Google Cloud Console)

1. Go to <https://console.cloud.google.com> and create a project (e.g. "Chop Lean").
2. **APIs & Services → OAuth consent screen**: choose *External*, set app name "Chop Lean", add your support email, and add your email as a test user while the app is in testing mode.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → application type **Web application**.
4. **Authorised JavaScript origins:** `http://localhost:3000` and `https://<your-vercel-domain>`.
5. **Authorised redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-vercel-domain>/api/auth/callback/google`
6. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Sessions are stored in the database (`sessions` table) through the Drizzle adapter.

### Sign-in options

`/signin` offers three ways in, all creating the same kind of database session:
1. **Google** (OAuth, steps above).
2. **Email and password.** *Create account* asks for name, email and password, then emails a 6-digit code to verify the address before the account exists (this prevents someone registering your email with their password). *Forgot password* uses the same code to set a new one. Passwords are stored as salted scrypt hashes, 5 wrong tries lock an email for 15 minutes, and you can add or change a password under Account → Password.
3. **Email code only** (below).

### Email sign-in (no password, no account set-up)

`/signin` also offers "Email me a code": enter an email, receive a 6-digit code through Mailgun, type it in and you are signed in (an account is created silently the first time). Codes are hashed in the `login_codes` table, work once, expire after 10 minutes, allow 5 wrong attempts, and requests are rate-limited. A successful code creates the same database session Google sign-in does. Google and email sign-in link to the same account when the email matches.

**Receiving the codes needs Mailgun configured** (section 4). Without it, in development only, the code is printed in the terminal running `pnpm dev`. In production a missing Mailgun key shows "We couldn't send the email" instead.

**Admin access:** put your Google email(s) in `ADMIN_EMAILS` (comma separated). Those accounts can open `/admin`; everyone else gets a 404. Admin is checked in `app/admin/layout.tsx` and in every admin server action. `middleware.ts` only checks that a session cookie exists, because database sessions cannot be read at the edge.

## 4. Mailgun (confirmation emails)

1. Create an account at <https://www.mailgun.com>.
2. **Sending → Domains → Add new domain** (e.g. `mg.yourdomain.com`) and add the DNS records Mailgun shows (SPF, DKIM, and optionally tracking/MX). Wait until it shows *Verified*.
   - *No domain yet?* Use the sandbox domain Mailgun gives you and add the recipients you want to test with under **Authorized recipients** (sandbox only delivers to these).
3. **Settings → API keys**: create a key.
4. Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` (e.g. `Chop Lean <orders@mg.yourdomain.com>`) and `MAILGUN_REGION` (`us` or `eu`, matching the region you chose).

Emails sent (React Email templates in `emails/`):
- order confirmation to the customer (with bank details for transfer orders)
- new-order alert to `ADMIN_EMAILS`
- payment-confirmed (when an admin confirms a transfer)
- status update whenever an admin changes an order's status

Email failures are logged and never block checkout.

To preview an email without sending it (development only): `/api/dev/email?type=confirmation&order=<order uuid>` (also `type=paid`, `type=status`, `type=code`). The order uuid is the long id in `/order/<uuid>`.

## 5. Paystack (card payments, test mode)

1. Create an account at <https://paystack.com> and stay in **Test mode**.
2. **Settings → API Keys & Webhooks**: copy the test public key (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) and secret key (`PAYSTACK_SECRET_KEY`).
3. Set the webhook URL to `https://<your-vercel-domain>/api/webhooks/paystack` (for local testing use a tunnel such as ngrok). The route verifies the `x-paystack-signature` HMAC and checks the amount before marking an order paid.
4. Test card: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

The charge amount always comes from the database, and the browser result is re-verified against Paystack's API before an order is marked paid.

## 6. File uploads (Vercel Blob)

Admin product photos and bank-transfer receipts use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). In Vercel: Storage → Create → Blob, connect it to the project, and copy `BLOB_READ_WRITE_TOKEN` into `.env.local`. (The original brief mentions a Supabase Storage bucket; Neon has no file storage, so Blob is used instead.)

## 7. Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Run `pnpm db:migrate && pnpm db:seed` once against the production database (locally with the production `DATABASE_URL`).
4. Add the production URLs to Google (step 3) and the Paystack webhook (step 5).

The live test deployment is at <https://chop-lean.vercel.app> (Vercel project `chop-lean`, repo `kaktech/chop-lean`). To switch features on, add these in Vercel → Project → Settings → Environment Variables (Production), then redeploy: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_REGION`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. `NEXT_PUBLIC_*` values are baked in at build time, so changing them needs a new deployment.

## How it works (things worth knowing)

- **Money** is stored in kobo. Totals, discounts, delivery and the pay-on-delivery fee are always recomputed on the server (`lib/pricing.ts`, `lib/orders.ts`); the browser's numbers are display-only.
- **Dates:** delivery days are Mon, Wed and Fri; orders close 6pm the day before; pause/skip closes Thursday 6pm; all in Africa/Lagos (`lib/lagos-time.ts`).
- **Plan pricing rule:** the calorie option sets the weekly price; choosing fewer meals/day or fewer days/week scales it proportionally (rounded to ₦100); "Subscribe and save" is 10% off. This rule is not in the brief, so change `planUnitPrice` if your kitchen prices differently.
- **Promo CHOPLEAN20:** 20% off the first week of each plan line, first orders only. Meals and drinks are not discounted.
- **Kitchen prep list:** counts active plan orders against the weekly menu. A Monday delivery covers Mon+Tue menu days, Wednesday covers Wed+Thu, Friday covers Fri; 3 meals/day = breakfast+lunch+dinner, 2 = lunch+dinner, 1 = lunch. Adjust in `lib/admin-queries.ts`.
- **Guest checkout:** the order id (a UUID) acts as the access link for guests.
- **Cart:** guests use localStorage; signed-in carts are saved in the database and the guest cart is merged on sign-in.
- **Reviews:** only real customer reviews are shown. The home page shows placeholder cards until some exist. A review gets a "Verified order" badge when the order number and email match an order containing that product.

## Design

The storefront uses a dark, photographic "kitchen" theme (tokens in `app/globals.css`, shared pieces in `components/ui/`). It replaces the light handoff design, per the later request. `DESIGN.md` and `screenshots/` describe the original light version and are kept for reference.

Pages: Home, Full menu (`/menu`), Collections (`/collections`, `/collections/[slug]`: breakfast, lunch, dinner, swallow-and-soups, high-protein, low-carb, office-lunch, drinks), Shop, Plan and meal pages, Quiz, Cart, Checkout, Our kitchen (`/about`), Meet the dietitian (`/dietitian`), Delivery (`/delivery`), FAQs (`/faq`), Contact (`/contact`), Gift cards (`/gift-cards`), Results (`/results`), Terms, Privacy, Account and Admin.

Also: Track an order (`/track`, order number + email), Saved dishes (`/favourites`, hearts are stored in the browser), and an unsubscribe page for the weekly menu email.

Each plan page is its own page: its own gallery (the plan's cover plus dishes from its menu), tagline and copy (`lib/plan-content.ts`), a plan-specific weekly menu (`lib/plan-menu.ts` re-picks dishes by the plan's tags, size and meals per day), and a comparison table. The header's Menu and Meal Plans items open dropdown panels listing every collection and plan.

**Weekly menu email.** Subscribing in the footer saves the address and immediately emails the current weekly menu (with an unsubscribe link). In Admin → Weekly menu, "Send menu to subscribers" emails it to everyone (up to 500 per click). Both need Mailgun configured.

Content to review before launch: the Terms and Privacy pages are drafts (including a 24-hour problem-reporting window), the Dietitian page has a placeholder for the real dietitian's name and credentials, and the WhatsApp number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER` (the links fall back to the contact page until you set it). Dish calories on plan pages are at standard portion; the page says the kitchen sizes portions to your daily target, so confirm that matches how you cook. Collection rules are shown on each collection page (for example high-protein means 30g+ protein).

## Deviations from the original design (on purpose)

- The Payment screen shows card number/expiry/CVV fields. We use Paystack's secure popup instead, so card data never touches this app.
- The Success screen's "confirmation email preview" panel is a design annotation and is not rebuilt.
- Shop tab counts and facet counts are computed from the database, so they differ from the sample numbers in the screenshots.
- Nutrition numbers in the seed data are placeholders: have a dietitian verify them before launch.
- Several photos are watermarked or show other brands (see `DESIGN.md`). Replace them before a real launch.
- Admin shows the "Storefront theme" cards, but only Editorial Green exists; Night Market is marked "Soon".

## Tests

- `pnpm test`: Vitest for pricing, promos, the calorie formula, shop filters, delivery cutoffs and money formatting.
- `pnpm test:e2e`: Playwright happy path (browse → add to cart → guest checkout → pay on delivery → confirmation). Run `pnpm exec playwright install chromium` once first. It creates a real order in whichever database `DATABASE_URL` points to.
