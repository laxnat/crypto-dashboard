# Crypto Dashboard

A real-time cryptocurrency dashboard built with React Router v7, TypeScript, and Tailwind CSS. Displays live exchange rates from the Coinbase API with drag-and-drop reordering, filtering, dark mode, and session-based authentication.

> **Note on framework:** The exercise specifies Remix + React. This project uses React Router v7, which is the direct successor to Remix — the Remix team merged Remix into React Router in v7. All full-stack patterns are identical: server-side loaders, actions, SSR, and file-based routing all work the same way.

---

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable         | Description                         | Default                           |
|------------------|-------------------------------------|-----------------------------------|
| `SESSION_SECRET` | Secret used to sign session cookies | `dev-secret-change-in-production` |
| `AUTH_EMAIL`     | Login email for the dashboard       | `admin@example.com`               |
| `AUTH_PASSWORD`  | Login password for the dashboard    | `password`                        |

> In production, set `SESSION_SECRET` to a long random string.

### Run

```bash
npm run dev       # development server at http://localhost:5173
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint
npm run format    # Prettier
npm test          # Vitest unit tests
```

---

## Features

- Live USD and BTC exchange rates for 12 cryptocurrencies via the Coinbase API
- Drag-and-drop card reordering (persisted to localStorage)
- Filter by name or symbol
- Manual refresh + 60-second auto-refresh
- Dark / light mode toggle (respects OS preference, persisted to localStorage)
- Session-based authentication protecting the dashboard
- Loading skeletons, error states, and empty filter state
- Fully typed with TypeScript strict mode

---

## Architecture & Decisions

### Data fetching

Single bulk fetch to `https://api.coinbase.com/v2/exchange-rates?currency=USD` on every page load via a server-side loader. One call returns rates for all coins — avoids N-per-coin requests and rate limits. USD and BTC rates are derived mathematically:

```
usdRate = 1 / rates[symbol]
btcRate = rates["BTC"] / rates[symbol]
```

Refresh uses React Router's `useRevalidator` to re-run the loader without a full navigation, preserving all client state (filter, card order).

### Drag and drop

`@dnd-kit/sortable` with `PointerSensor` (5px activation distance to prevent accidental drags on scroll, touch-compatible). `coinOrder` — an array of symbols — is the source of truth for ordering. `filteredCoins` is always derived from it, so filtering never corrupts the stored order.

### Authentication

Cookie-based sessions via React Router's `createCookieSessionStorage`. Session data is stored in the cookie itself (signed + encrypted) — no server-side session store needed. `requireAuth` throws a redirect from the loader so unauthenticated requests never reach the Coinbase API call. Logout is a POST action to prevent CSRF via GET.

### Styling

Tailwind CSS v4 utility classes directly in JSX. Coinbase-inspired palette: white/gray-50 backgrounds, blue accents, near-black text. Class-based dark mode via `@custom-variant dark` — a `<script>` in `<head>` applies the `.dark` class before React hydrates to prevent flash of wrong theme.

### State

No external state library. All state lives in `home.tsx`:

- `coinOrder` — drag order, initialized from localStorage (SSR-safe `typeof window` guard)
- `filter` — controlled filter input
- `isDark` — theme toggle, synced to `document.documentElement`

---

## Tradeoffs

- **Single hardcoded user** — credentials live in env vars. Multi-user would require a database (SQLite + Drizzle was the considered path) which was out of scope.
- **localStorage for order persistence** — per-browser, not per-account. Acceptable for a single-user dashboard.
- **No coin logos from Coinbase** — the rates API doesn't return icons. Icons are pulled from the CoinCap CDN using the lowercase symbol pattern (e.g. `btc@2x.png`).
- **12 hardcoded coins** — the API returns 200+ currencies. The supported list is intentionally curated in `app/coins.ts`.
- **No caching layer** — rates are fetched fresh on every load and revalidation. Acceptable given the 60-second auto-refresh interval.

---

## Adding a new coin

1. Open `app/coins.ts`
2. Add an entry to the `COINS` array:
   ```ts
   { symbol: "XLM", name: "Stellar", iconUrl: icon("xlm") },
   ```
3. The symbol must match what the Coinbase API uses. The icon is automatically derived from the lowercase symbol via CoinCap CDN.

---

## Guidelines for AI follow-up features

### File & folder conventions

```
app/
  routes/          # Route modules — loader + default component in the same file
  *.tsx            # Shared components (CryptoCard, FilterInput, SortableCryptoCard)
  *.ts             # Non-component modules (types, utils, coins, session.server)
  *.test.ts        # Unit tests co-located with the file they test
```

### Naming conventions

- Components: `PascalCase` (`CryptoCard.tsx`)
- Utilities / data: `camelCase` (`utils.ts`, `coins.ts`)
- Server-only modules: `*.server.ts` suffix (`session.server.ts`) — React Router excludes these from the client bundle automatically

### Data fetching pattern

All data fetching happens in route loaders (`export async function loader`). Components receive data via `useLoaderData` — they never fetch directly. New data requirements should be added to the loader, not fetched inside components with `useEffect`.

### Adding a new route

1. Create `app/routes/my-route.tsx` with a default export component and optional `loader` / `action`
2. Register it in `app/routes.ts`:
   ```ts
   route("my-route", "routes/my-route.tsx"),
   ```

### Protected routes

Call `await requireAuth(request)` as the first line of any loader that should be behind auth. It throws a redirect to `/login` automatically — no additional handling needed in the component.

### Testing conventions

Unit test pure functions (utils, type guards) in co-located `*.test.ts` files using Vitest. Components are not snapshot-tested — prefer testing the logic they depend on.
