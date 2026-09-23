# Pin Tracker

A small webapp for tracking a pin collection: what you own, what you paid, what it's worth now, your trade history, and your wishlist.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, TypeScript, Tailwind CSS)
- [Prisma 7](https://www.prisma.io/) + [Neon](https://neon.tech) (serverless Postgres)
- Photo uploads stored in [Cloudflare R2](https://developers.cloudflare.com/r2/)
- A basic-auth gate (`src/proxy.ts`) protects the whole site once deployed

## Getting started (local dev)

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (see [Neon setup](#1-database-neon-postgres) below — for local dev you can point at the same Neon project, or create a separate branch for it).
2. Install dependencies and apply the schema:
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

Leave `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` unset locally — the proxy only enforces the login when both are set (e.g. in production).

To change the data model, edit `prisma/schema.prisma` then run:

```bash
npx prisma migrate dev --name <describe-the-change>
```

## What it tracks

- **Collection** (`/pins`) — each pin: name, set/series, photo, how and when you got it, price paid, and current estimated worth (so you can see gain/loss). Click a pin for its full detail page, including trade history.
- **Wishlist** (`/wishlist`) — pins you're after, with priority and estimated worth. "Got it! Add to collection" turns a wishlist entry into a collection pin.
- **Trades** (`/trades`) — log what you gave and received in a trade. A given item can be linked to a pin already in your collection (its original price paid carries over as the new pin's cost, and it's removed from your collection); a received item can optionally be added straight to your collection. Shipping cost is tracked as an expense.
- **Sold** (`/sold`) — pins you've sold, with realized profit after shipping cost.
- **Dashboard** (`/`) — total pins, total paid, estimated worth, unrealized gain/loss, and realized profit.

## Deploying to the internet (Vercel + Neon + R2)

This app has **no user accounts** — the basic-auth gate is the only thing standing between the internet and your data once deployed. Don't skip setting `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` in production.

### 1. Database: Neon Postgres

1. Create a free account at [neon.tech](https://neon.tech) and a new project.
2. In the project dashboard, go to **Connect** and copy the **pooled connection string** (it looks like `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
3. Put it in `.env` as `DATABASE_URL` locally, and run `npx prisma migrate dev --name init` once to create the tables.
4. You'll set the same variable in Vercel later (step 4). Neon supports free branching if you want separate dev/prod databases — not required to get started.

### 2. Photo storage: Cloudflare R2

1. Create a free Cloudflare account, then go to **R2** in the dashboard and create a bucket (e.g. `pin-tracker-uploads`).
2. In the bucket's **Settings**, enable **Public access** (via the R2.dev subdomain, or attach a custom domain) and copy that public base URL — this is `R2_PUBLIC_URL`.
3. Go to **R2 → Manage API tokens**, create a token with **Object Read & Write** permission, and copy the **Access Key ID** and **Secret Access Key**.
4. Your **Account ID** is shown on the main Cloudflare dashboard sidebar (`R2_ACCOUNT_ID`).
5. Fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` in `.env`.

### 3. Push the code to GitHub

Vercel deploys from a Git repository:

```bash
gh repo create pin-tracker --private --source=. --push
```

(or create a repo on github.com and `git remote add origin <url> && git push -u origin master`)

### 4. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new), sign in, and import the GitHub repo.
2. Before the first deploy, add these Environment Variables (Project Settings → Environment Variables): `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` — same values as your `.env`, but pick a real password for the basic-auth pair.
3. Deploy. Vercel runs `npm install` (which runs `prisma generate` via `postinstall`) then `next build`.
4. Visit the assigned `*.vercel.app` URL — your browser will prompt for the username/password you set.

**Note on photo size**: Vercel Functions hard-cap every request body at **4.5 MB**, with no way to raise it — this app's `serverActions.bodySizeLimit` in `next.config.ts` is set to `4mb` to match. A modern phone's full-resolution camera photo can exceed that; if an upload fails, resize/compress the photo first (or use a smaller "Photos" export size) before picking it. Uploading from a URL instead has no such limit.
