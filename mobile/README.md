# Chop Lean mobile app (Expo / React Native)

The app uses the same server and database as the website (`https://chop-lean.vercel.app`), through the `/api/mobile/*` endpoints.
One account works on both, and the cart is a single saved cart that both read and write.

## Run it on a phone
1. Install **Expo Go** from the App Store / Google Play.
2. From this folder: `npm install` (first time only), then `npx expo start --tunnel`.
3. Scan the QR code with the phone camera (iPhone) or inside Expo Go (Android).

## What it does
- **Sign in** with email + password, or an emailed 6-digit code (also creates the account if new).
- **Menu**: live plans, meals and drinks, with Add to cart.
- **Cart**: shared with the website. It re-reads the server every 3 seconds, and changes are applied on the server.
- **Checkout**: opens the website checkout already signed in, to pay with Paystack.
- **Account**: weight log (shows on the website too), orders, sign out.

## API (`app/api/mobile/*` in the web app)
`POST /login`, `POST /code`, `POST /verify`, `POST /logout`, `GET /me`, `GET /products`, `GET|POST /cart`,
`GET|POST /weight`, `GET /orders`, `POST /handoff`. Authenticated calls send `Authorization: Bearer <session token>`.
