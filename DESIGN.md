# Chop Lean — Design Spec

Chop Lean is a Lagos weight-loss meal plan store: calorie-counted Nigerian meals sold as weekly subscriptions, delivered chilled on Mon, Wed and Fri.

This document is the single source of truth for the look and behaviour. The pixel-level reference is in:

- `screenshots/` — full-page PNG of every screen (desktop at 1440px wide, mobile at 390px wide). **Match these.**
- `preview/` — every screen as plain HTML. Open in a browser to see the hover and entrance animations. Links between pages work.
- `design-source/` — the original design files (`*.dc.html`). They are HTML with inline styles; `{{name}}` placeholders are filled from the data in the `<script>` block at the bottom of each file. Read them for exact sizes, colours and copy.
- `design-source/animations.css` — every keyframe and animation class used.
- `public/images/` — all photos, already named. Use them as-is.
- `seed/menu.json` — plans, meals, drinks, weekly menu, delivery zones, promo code.

## 1. Design tokens

### Colours

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F7F6F1` | Page background |
| `surface` | `#FFFFFF` | Cards, header, inputs |
| `ink` | `#15201A` | Main text, black buttons, dark sections |
| `muted` | `#5B6560` | Secondary text (passes 4.5:1 on white) |
| `body` | `#3A4540` | Paragraph text |
| `line` | `#E6E4DC` | Card borders, dividers |
| `input-line` | `#D6D3C8` | Input borders |
| `green` | `#3D6B1F` | Brand green: angled panels, primary button, active states |
| `green-dark` | `#24421A` | Announcement bar, text on mint |
| `green-tint` | `#F1F8EC` | Selected radio card background |
| `yellow` | `#F6B81A` | Main CTA pill (always dark text on it), badges |
| `red` | `#D93A2B` | Sale badges, accents |
| `price-red` | `#B4281C` | Prices, errors (text) |
| `mint` | `#DCEFD2` | Promo card, kcal pills |
| `pink` | `#F9DCDC` | Promo card |
| `lavender` | `#DDE0F6` | Promo card |
| `butter` | `#FCEBC9` | Upsell card, "pending" status |
| `dark-card` | `#1F2D25` | Cards inside dark sections |

Status pills: Pending payment `#FCEBC9`/`#6B4A00`, Cooking `#DDE0F6`/`#2B3480`, Out for delivery `#F9DCDC`/`#8E1F14`, Delivered `#DCEFD2`/`#24421A`.

### Typography (Google Fonts)

- **Outfit** 600/700/800: headlines, prices, numbers, card titles. Tight tracking (−0.02 to −0.035em).
- **DM Serif Display** 400 regular and italic: editorial accents (the green italic "Grew Up On"), the giant faded watermark words, quotes.
- **DM Sans** 400/500/700: body, labels, buttons.

| Role | Desktop | Mobile |
|---|---|---|
| Hero H1 | Outfit 700, 72px / 1.0 | 42px / 1.02 |
| Section H2 | Outfit 700, 48px | 30px |
| Page H1 | Outfit 700, 56–60px | 34–36px |
| Card title | Outfit 700, 19–20px | 15–19px |
| Price | Outfit 700, 20px (cards), 36px (plan page) | 15–26px |
| Body | DM Sans 16–18px / 1.6 | 14–16px |
| Small label | DM Sans 700, 12px, uppercase, 0.1–0.14em tracking | same |
| Watermark word | DM Serif Display 170px at 5% ink opacity | 84–110px |

### Shape, spacing, depth

- Radius: cards 22–26px, inputs 12–14px, pills/buttons 999px, small badges 6px.
- Container: max-width 1280px, 32px side padding (16px on mobile).
- Section spacing: 80–110px vertical desktop, 34–44px mobile.
- Shadows: soft only: `0 10px 30px rgba(21,32,26,.08)`; floating chips `0 18px 44px rgba(21,32,26,.22)`.
- Touch targets ≥ 44px. Icons: 1.8–2px stroke line icons (use lucide-react).

## 2. Signature elements (do not lose these)

1. **Angled deep-green panels** made with `clip-path: polygon(...)`, behind the hero photo and at section corners.
2. **Giant faded serif watermark words** behind section titles ("Plans", "Menu", "Offers", "Kitchen", "Pay") and vertical rotated words ("NAIJA", "LEAN") inside green panels.
3. **Headline with one phrase in green DM Serif Display italic.**
4. **Yellow pill primary CTA**, black pill secondary CTA, red rectangular sale badge.
5. **Floating white info chips** over photos ("Jollof, chicken and plantain · 450 kcal").
6. **Rotating circular text badge** ("CALORIE COUNTED • NAIJA MADE •", "-0.5kg" in the middle).
7. **Dark dish ticker** (marquee) under the hero with round dish thumbnails and kcal.
8. **Pastel bento offer cards** (mint big card + pink + lavender).

## 3. Animations (see `design-source/animations.css`)

Use Framer Motion (`motion`) or CSS. Keep everything subtle and fast; respect `prefers-reduced-motion` (disable all).

| Where | Effect | Spec |
|---|---|---|
| Hero text | Staggered fade-up | 28px rise, 0.9s, cubic-bezier(.2,.7,.2,1), delays 0.08/0.18/0.3/0.44/0.6s |
| Hero photo | Clip-path wipe reveal | inset(0 100% 0 0) → inset(0), 1.2s |
| Floating chips | Gentle bob | translateY 0 → −10px, 5s and 6.5s loops, offset |
| Circular badge | Rotate | 360° in 18s, linear, infinite |
| Dish ticker | Marquee | translateX 0 → −50%, 38s linear, pauses on hover |
| Sections & cards | Scroll reveal | fade-up 40px when entering viewport (whileInView, once) |
| Product cards | Hover lift + image zoom | translateY −6px + shadow; image scale 1.07 over 0.7s |
| Buttons | Hover lift, press | translateY −2px + shadow; active scale .98 |
| Add to cart | Toast + drawer | toast springs up from bottom-left; cart drawer slides in from right (desktop) / bottom sheet (mobile), 0.5s |
| Cart badge | Pop | scale 1 → 1.35 → 1 when count changes |
| Plan gallery | Crossfade | 0.3s fade when switching photo |
| Order confirmed | Check mark pops in, headline fades up | |

## 4. Responsive rules

- **≥1024px:** desktop designs (`Main`, `Shop`, `Product`, ...).
- **<768px:** mobile designs (`MHome`, `MShop`, `MProduct`, `MCart`, `MCheckout`, `MAccount`): sticky top header (menu, logo, search, yellow cart button with count), **sticky bottom tab bar** (Home, Plans, Quiz, Cart, Me), horizontal snap-scroll carousels, sticky bottom action bars on plan and checkout pages, cart as a bottom sheet.
- **768–1023px:** desktop layout with 2-column grids.
- Hero photo: `hero-wide.jpg` on desktop (couple on the right, text on the left), `hero-tall.jpg` on mobile (use `<picture>` or `next/image` with art direction).

## 5. Screens → routes

| Design file | Route | Notes |
|---|---|---|
| `Main` / `MHome` | `/` | Hero, ticker, how it works, shop by goal, this week's plans, offers, method, new on the menu, kitchen-to-gate, reviews, newsletter, footer |
| `Quiz` | `/quiz` | Calorie quiz (Mifflin-St Jeor), recommendation card |
| `Shop` / `MShop` | `/shop` (`?tab=plans|meals|drinks`) | Filters, chips, sort, grid, pagination |
| `Product` / `MProduct` | `/plans/[slug]` and `/meals/[slug]` | Gallery, calorie selector, options, weekly menu (day tabs on mobile), add-to-cart drawer + toast, accordions, reviews |
| `Review` | modal on product page | Stars, text, fullness, pepper level, weight change, name, order ID, email |
| `Cart` / `MCart` | `/cart` + drawer/sheet | Upsell, promo code |
| `Checkout` / `MCheckout` | `/checkout` | Google or guest, contact, delivery zone, date, window, address validation |
| `Payment` | `/checkout/pay` | Card (Paystack) / bank transfer / pay on delivery |
| `Transfer` | `/checkout/transfer/[orderId]` | Account details, 30-min hold, receipt upload, awaiting state |
| `PayFailed` | `/checkout/failed` | |
| `Success` | `/order/[id]` | Confirmation; email preview shows the Mailgun template |
| `SignIn` | `/signin` | Google only |
| `Account` / `MAccount` | `/account` | Active plan, weight log + chart, orders |
| `Menu` | mobile menu drawer | |
| `Admin` | `/admin` | KPIs, store setup, theme, kitchen prep list, plan mix, orders with status |
| `AdminProducts` | `/admin/products` | Tabs, search, lock inventory, slots, edit form + photo upload |
| `AdminPayments` | `/admin/payments` | Confirm transfers, payment log |
| `Header`, `Footer` | shared layout | |

## 6. Image map (`public/images/`)

| File | Used for |
|---|---|
| `hero-wide.jpg` | Desktop hero |
| `hero-tall.jpg` | Mobile hero |
| `jollof.jpg` | Jollof meal, hero chip, ticker |
| `efo-riro.jpg` | Efo riro meal, "Calorie plans" category, plan gallery |
| `ofada.jpg` | Ofada meal, Naija Lean plan cover |
| `white-soup.jpg` | Swallow Smart plan cover, white soup meal |
| `egusi.jpg` | Swallow Smart category and offer |
| `chicken-salad.jpg` | Suya salad, Low-Carb plan |
| `grilled-fish.jpg` | Grilled croaker, Protein Cut plan |
| `pepper-soup.jpg` | Pepper soup, Low-Carb cover on home |
| `moi-moi.jpg`, `moimoi-chicken.jpg` | Breakfasts, High-protein category |
| `akara.jpg`, `plantain-egg.jpg`, `potato-egg.jpg` | Breakfasts |
| `beans-porridge.jpg`, `plantain-porridge.jpg`, `okra-soup.jpg`, `fried-rice.jpg` | Meals |
| `zobo.jpg`, `tiger-nut.jpg` | Drinks, upsell |
| `meal-box.jpg` | Office Lunch plan, "Packed and labelled", email header |
| `kitchen.jpg` | "Cooked fresh" |
| `rider.jpg` | "Delivered chilled" |
| `signin.jpg` | Sign-in panel |
| `woman-cafe.jpg` | Reviews block |
| `rider-street.jpg`, `rider-black.jpg` | Spare |

Several food photos are from other creators (watermarked) and the drink bottles show other brands. They are fine for the demo; replace them before a real launch.

## 7. Copy and data rules

- Currency: Naira, formatted `₦52,500` (cards) and `NGN 52,500.00` (plan page and checkout totals). Use `Intl.NumberFormat('en-NG')`.
- Every meal shows kcal; every plan shows kcal/day, meals/day and days/week.
- Health disclaimer in the footer and quiz: plans support weight management; they are not medical treatment.
- Review cards show placeholders until real reviews exist; never ship fake testimonials.
