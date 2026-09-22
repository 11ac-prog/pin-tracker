# Pin Tracker

A small webapp for tracking a pin collection: what you own, what you paid, what it's worth now, your trade history, and your wishlist.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, TypeScript, Tailwind CSS)
- [Prisma 7](https://www.prisma.io/) + SQLite (`dev.db` in the project root)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database file (`dev.db`) is created automatically the first time you run a Prisma command or start the app. If you ever need to reset it or (re)apply the schema:

```bash
npx prisma migrate deploy
```

To change the data model, edit `prisma/schema.prisma` then run:

```bash
npx prisma migrate dev --name <describe-the-change>
```

## What it tracks

- **Collection** (`/pins`) — each pin: name, set/series, image, how and when you got it, price paid, and current estimated worth (so you can see gain/loss).
- **Wishlist** (`/wishlist`) — pins you're after, with priority and estimated worth. "Got it! Add to collection" turns a wishlist entry into a collection pin.
- **Trades** (`/trades`) — log what you gave and received in a trade. A given item can be linked to a pin already in your collection (it's removed from your collection when the trade is saved). A received item can optionally be added straight to your collection.
- **Dashboard** (`/`) — total pins, total paid, estimated worth, overall gain/loss, and recent activity.

## Deploying beyond this machine

This is currently set up to run locally with a SQLite file on disk, which is the simplest option for single-machine use. If you want it reachable from your phone or other devices, you have two straightforward paths later on:

1. **Keep SQLite, add a host**: run this same app on a small always-on machine (e.g. a Raspberry Pi, a cheap VPS, or a NAS with Docker) and access it over your home network or a VPN like Tailscale. No code changes needed.
2. **Move to hosted Postgres**: swap the Prisma datasource to Postgres (e.g. a free tier on Neon or Supabase) and deploy the app to a platform like Vercel or Fly.io. This needs a schema/datasource change in `prisma/schema.prisma` and a new `DATABASE_URL`, but the rest of the app is unaffected.

Either way, since there's currently no login, put it behind your home network, a VPN, or add basic auth before exposing it to the public internet.
