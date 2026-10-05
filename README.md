# Sigma Gadgets Mobile

The mobile app for the [Sigma Gadgets](https://sigma-gadgets.vercel.app) shop. It uses the website's API, the same accounts and the same cart.

- **Website:** https://sigma-gadgets.vercel.app
- **Website source and API docs:** https://github.com/francis-7-tech/Sigma-Gadgets

## Features

- Browse products by category and open a product page
- Sign in with the same Google account as the website
- Add to cart, change quantities and remove items
- The cart is shared with the website and updates in real time in both directions
- Checkout opens the website

## Tech stack

| | |
|---|---|
| Framework | Expo SDK 57 (React Native), TypeScript |
| Navigation | Expo Router |
| Data | TanStack Query |
| Real-time | Pusher Channels |
| Token storage | Expo SecureStore |
| Tests | Vitest |
| Builds | EAS Build |

## Getting started

1. Install Node.js 22 or newer and the **Expo Go** app on your phone.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app and scan the QR code with your phone:
   ```bash
   npx expo start
   ```

The app talks to `https://sigma-gadgets.vercel.app` by default. To use another server, set `EXPO_PUBLIC_API_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run typecheck` | Type-check the code |
| `npm test` | Unit tests |
| `npm run build:apk` | Build an Android APK with EAS |

## How it works

**One account.** Tapping "Sign in with Google" opens the website's sign-in page in the phone's browser. The website sends back a one-time code (60 seconds, single use, protected with PKCE), and the app swaps it for a login token. The token is stored in the phone's encrypted storage and sent as `Authorization: Bearer <token>`.

**One cart.** The app and the website read and write the same cart through the same server code.

**Real time.** After every cart change the server sends a `cart-changed` signal on a private Pusher channel for that user. The app and the website both listen and reload the cart. The signal carries no cart data, and the server only lets a signed-in user listen to their own channel. The app also reloads the cart when it is reopened or reconnects.

## API endpoints used

| Method | Endpoint | Used for |
|---|---|---|
| `GET` | `/api/v1/products`, `/api/v1/products/{slug}`, `/api/v1/categories` | Shop and product pages |
| `GET` | `/mobile/authorize` | Sign-in page opened in the browser |
| `POST` | `/api/mobile/token` | Swap the one-time code for a login token |
| `GET` | `/api/v1/me` | Check the login token |
| `DELETE` | `/api/v1/session` | Sign out |
| `GET` | `/api/v1/cart` | Read the cart |
| `POST` | `/api/v1/cart/items` | Add to cart |
| `PATCH`, `DELETE` | `/api/v1/cart/items/{productId}` | Change quantity, remove |
| `GET`, `POST` | `/api/v1/realtime`, `/api/v1/realtime/auth` | Real-time channel details and permission |

## Project structure

```
src/
  app/          screens (Expo Router): (tabs)/index, (tabs)/cart, (tabs)/account, product/[slug], auth
  components/   button, product card, screen message
  context/      auth (sign-in state), cart-sync (real-time connection)
  hooks/        cart queries and mutations
  lib/          API client, PKCE helpers, money, theme, session storage
```

## Build the APK

```bash
npx eas-cli@latest login
npm run build:apk
```

EAS builds in the cloud and gives a download link for the `.apk`.

## Manual test on a phone

1. On the website, sign in with a new Google account and add an item to the cart.
2. Open the app, go to **Account** and sign in with the same Google account.
3. Open **Cart**: the item from the website is there.
4. Go to **Shop**, open another product and tap **Add to cart**.
5. Back on the website, the cart shows the item added from the app.
