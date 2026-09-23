# Pin Tracker

A small webapp for tracking a pin collection: what you own, what you paid, what it's worth now, your trade history, and your wishlist.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, TypeScript, Tailwind CSS)
- [Prisma 7](https://www.prisma.io/) + Postgres, provisioned from Vercel's Storage tab (Vercel Marketplace's Neon integration — no separate account)
- Photo uploads via [Vercel Blob](https://vercel.com/docs/vercel-blob) (also provisioned from the same Storage tab)
- A basic-auth gate (`src/proxy.ts`) protects the whole site once deployed

Everything storage-related is set up from inside the Vercel dashboard — see [Deploying](#deploying-to-the-internet-vercel) below. There's no separate Neon or Cloudflare account to create.

## Getting started (local dev)

Local dev pulls its environment from the deployed Vercel project, so [deploy first](#deploying-to-the-internet-vercel), then:

```bash
npm install -g vercel   # if you don't have it
vercel link             # connect this folder to the Vercel project
vercel env pull         # writes .env.local with DATABASE_URL, blob token, etc.
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` won't be in the pulled env (they're production-only), so the proxy leaves local dev unlocked.

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

## Deploying to the internet (Vercel)

This app has **no user accounts** — the basic-auth gate is the only thing standing between the internet and your data once deployed. Don't skip step 4.

### 1. Push the code to GitHub

```bash
gh repo create pin-tracker --private --source=. --push
```

(or create a repo on github.com and `git remote add origin <url> && git push -u origin master`)

### 2. Import into Vercel

Go to [vercel.com/new](https://vercel.com/new), sign in, and import the GitHub repo. Deploy it — it's fine that pages will error for now, since there's no database yet.

### 3. Add storage from the Storage tab

In the new project, open **Storage**:

1. **Create Database → Postgres** (this is Neon under the hood, but provisioned and connected without leaving Vercel). Connect it to the project — this adds `DATABASE_URL` automatically.
2. **Create Database → Blob**. Connect it to the project too — this adds `BLOB_READ_WRITE_TOKEN` automatically.

### 4. Add the login

**Settings → Environment Variables**: add `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` with values of your choosing, scoped to **Production** only (leave Development unchecked, so `vercel env pull` doesn't lock you out of local dev later).

### 5. Create the database tables

From this project folder:

```bash
npm install -g vercel   # if you don't have it
vercel link              # connect this folder to the Vercel project you just made
vercel env pull          # writes .env.local with DATABASE_URL and the blob token
npx prisma migrate dev --name init
git add prisma/migrations && git commit -m "Add initial migration" && git push
```

Pushing triggers a redeploy with the tables in place.

### 6. Open it

Visit the `*.vercel.app` URL Vercel gave you — your browser will prompt for the username/password from step 4.

**Note on photo size**: Vercel Functions hard-cap every request body at **4.5 MB**, with no way to raise it — this app's `serverActions.bodySizeLimit` in `next.config.ts` is set to `4mb` to match. A modern phone's full-resolution camera photo can exceed that; if an upload fails, resize/compress the photo first (or use a smaller "Photos" export size) before picking it. Uploading from a URL instead has no such limit.
