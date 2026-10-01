# Chop Lean — design handoff (HNG15 Lesson 2)

Everything Claude Code needs to build the Chop Lean store.

## What's inside

| Folder / file | What it is |
|---|---|
| `CLAUDE_CODE_PROMPT.md` | The prompt to paste into Claude Code |
| `CLAUDE.md` | Project rules Claude Code reads automatically |
| `DESIGN.md` | Colours, fonts, animations, responsive rules, page list, image map |
| `screenshots/` | Full-page image of every screen (desktop and mobile) |
| `preview/` | Every screen as HTML you can open in a browser (start with `preview/Main.html` or `preview/MHome.html`) |
| `design-source/` | The original design files |
| `public/images/` | All 28 photos, named |
| `seed/menu.json` | Plans, meals, drinks, weekly menu, delivery zones, promo code |

## How to use it

1. Unzip this folder somewhere, e.g. `~/Projects/chop-lean`.
2. Open a terminal in that folder and run `claude`.
3. Paste everything below the line in `CLAUDE_CODE_PROMPT.md`.
4. Have these ready, because Claude Code will ask for them:
   - Supabase project URL, service role key and database connection string (or a Neon connection string)
   - Google OAuth client ID and secret (Google Cloud Console → APIs & Services → Credentials)
   - Mailgun API key and domain
   - Paystack test public and secret keys
   - The email address(es) that should get admin access

## HNG checklist (individual task)

- [ ] Shop website with a checkout page
- [ ] Everything persisted in Supabase/Neon
- [ ] Confirmation emails sent with Mailgun
- [ ] Google auth set up through Google Cloud Console

The team task (Zedu org and the group PR to `zedu.chat/contributors/<teamname>`) is separate and not part of this build.
