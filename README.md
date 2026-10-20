# Addressbook

A React + Express address book with MongoDB Atlas. Sign up, log in, and manage contacts with server-side search, an editable detail card, and map links.

## Features

- **Auth** — signup and login with bcrypt password hashing, JWT sessions (7 day expiry) stored in `localStorage`.
- **Contacts** — create, list, update, and delete contacts. Only the owning user can read or modify their own records.
- **Search** — server-side search across `name`, `email`, `phone`, and `address`, debounced on the client. Results sorted by name, capped at 500.
- **Detail card** — click a row to open a card with Escape/overlay close and focus management. Inline edit of `address` and `mapLink`, and a two-step delete confirm.
- **Map link** — optional `mapLink` per contact (validated as an `http(s)` URL). If absent, a Google Maps search URL is built from the address.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8 |
| Backend | Express 5 (ESM), Mongoose 9 |
| Auth | bcryptjs, jsonwebtoken |
| Lint | oxlint |

## Project structure

```
api/index.js          Vercel serverless entry (exports the Express app)
vercel.json           Rewrites /api/* → the function, everything else → index.html
server/
  app.js              Express app: CORS, JSON, /api/health, route mounts
  index.js            Local dev entry: loads .env, connects, listens on PORT
  middleware/auth.js  JWT bearer-token guard
  models/             User, Contact schemas
  routes/             auth.js, contacts.js
  seed.js             Seeds 12 demo contacts for an existing user
src/
  App.jsx             Home (list + search + detail card), route guards
  pages/              Login, Signup
  context/            AuthContext (session in localStorage)
  lib/api.js          fetch wrapper for the API
  lib/validation.js   Email regex + password strength scoring
```

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Then fill in `.env`:

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `MONGODB_URI` | yes | MongoDB Atlas connection string |
   | `JWT_SECRET` | yes | Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `MONGODB_DB` | no | Defaults to `addressbook` |
   | `PORT` | no | API port, defaults to `3001` |

   The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing.

3. **Run**

   ```bash
   npm run dev
   ```

   This starts the API (`server/index.js`) and Vite together. Vite proxies `/api` to `http://localhost:3001`, so the client uses relative URLs with no extra config.

   App: http://localhost:5173 — API health: http://localhost:3001/api/health

   > Note: Vite 8 binds IPv6 only. If `localhost` doesn't resolve, use `http://[::1]:5173`.

### Other scripts

| Script | What it does |
| --- | --- |
| `npm run server` | API only, no client |
| `npm run build` | Build the client to `dist/` |
| `npm run preview` | Serve the built client |
| `npm run seed` | Replace the current user's contacts with 12 demo records |
| `npm run lint` | Run oxlint |

### Seeding demo data

Sign up first, then run the seed. It replaces all contacts for the owner with 12 sample records:

```bash
SEED_OWNER_EMAIL=you@example.com npm run seed
```

`SEED_OWNER_EMAIL` defaults to `medicaremedi10@gmail.com`.

## API

All `/api/contacts` routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{ ok, db }` — `db` is `connected` or `disconnected` |
| `POST` | `/api/auth/signup` | — | `{ name, email, password }` → `{ user, token }`. Password min 8 chars |
| `POST` | `/api/auth/login` | — | `{ email, password }` → `{ user, token }` |
| `GET` | `/api/contacts?q=` | yes | List contacts, optional search `q` |
| `POST` | `/api/contacts` | yes | Create `{ name, phone, email, address, mapLink }` |
| `PATCH` | `/api/contacts/:id` | yes | Update `address` and/or `mapLink` |
| `DELETE` | `/api/contacts/:id` | yes | Delete a contact |

Errors return JSON: `{ error: string }`.

## Deploying to Vercel

The app is set up to deploy as a single Vercel project: the Vite client as static files, Express as a serverless function.

- `api/index.js` is the function entry. It imports the app from `server/app.js` and caches the Mongoose connection on `globalThis` so warm invocations reuse one pool.
- `vercel.json` rewrites `/api/*` to the function and everything else to `/index.html` (SPA fallback). Rewrites don't change `req.url`, so Express still sees the original `/api/...` paths.

Steps:

1. Push the repo to GitHub (already at `medicare10/addressbook`).
2. Import it at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite and runs `npm run build`.
3. Set the same environment variables in the project settings: `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`.
4. In Atlas, allow network access from `0.0.0.0/0` — Vercel function egress IPs are dynamic, so a fixed allowlist will break.

`.env` and `atlas-credentials.env` are gitignored; only `.env.example` is committed.
