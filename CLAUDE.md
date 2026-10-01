# Chop Lean — project rules for Claude Code

- The design is fixed: follow `DESIGN.md` and match `screenshots/` for every page. When unsure about a size, colour or line of copy, read the matching file in `design-source/`.
- Stack: Next.js 15 App Router, TypeScript, Tailwind v4, Drizzle + Postgres (Supabase or Neon), Auth.js v5 with Google, Mailgun, Paystack (test mode), motion, pnpm.
- Money is stored in kobo (integers) and formatted with `Intl.NumberFormat('en-NG')`. Totals, discounts and delivery fees are always calculated on the server.
- Time zone for cutoffs and delivery dates: Africa/Lagos. Delivery days are Mon, Wed and Fri; the order cutoff is 6pm the day before; pause/skip cutoff is Thursday 6pm.
- Photos live in `public/images/` with the names listed in `DESIGN.md` §6. Do not rename them.
- Respect `prefers-reduced-motion`. Keep 44px minimum touch targets and visible focus rings.
- Never commit secrets. Every new environment variable goes into `.env.example`.
- Do not invent customer reviews or testimonials; show the empty or placeholder state until real reviews exist.
