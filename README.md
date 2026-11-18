# WMart

Online store for laptop batteries, adapters, power cables and accessories.
It replaces the old Shopify (wmartstore.in) and WordPress (wmart.co.in) sites.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · shadcn/ui · Prisma 7 · PostgreSQL

## Getting started

1. Install Node.js 20+ and Git.
2. Install dependencies (this also generates the Prisma client):
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to **your own** database
   (one Neon branch per developer, e.g. `dev-ui` and `dev-admin`).
4. Create the tables and add sample data:
   ```bash
   npm run db:migrate -- --name init
   npm run db:seed
   ```
5. Start the dev server and open http://localhost:3000 (store) and http://localhost:3000/admin (admin):
   ```bash
   npm run dev
   ```

## Who owns what

| Store UI developer | Admin developer | Shared – talk before changing |
|---|---|---|
| `src/app/(shop)/` | `src/app/(admin)/admin/` | `prisma/schema.prisma` (admin dev owns it) |
| `src/components/shop/` | `src/components/admin/` | `src/components/ui/` (shadcn) |
| `src/server/queries/` (reads) | `src/server/actions/admin/` (writes) | `src/lib/`, `src/app/globals.css`, `package.json` |
| | `scripts/` (CSV import) | |
| | `src/lib/auth.ts` | |

## Folder structure

```
prisma/
  schema.prisma        database tables (product catalogue for now)
  seed.ts              sample data for development
scripts/               one-off import scripts (Shopify / WooCommerce CSV, images)
src/
  app/
    layout.tsx         root layout (fonts, global CSS, toasts)
    (shop)/            customer-facing pages – header + footer layout
      page.tsx         /
      c/[slug]         /c/laptop-batteries
      brand/[slug]     /brand/dell
      p/[slug]         /p/<product-slug>
      search           /search?q=HS04
      cart, checkout, account, login, track-order, faq, contact
      pages/[slug]     /pages/refund-policy, ...
    (admin)/admin/     admin panel – sidebar layout, login check on every request
      products, orders, customers, coupons, import
    api/webhooks/      PayU (payments) and Delhivery (shipping) callbacks
  components/
    ui/                shadcn/ui components (add more: npx shadcn@latest add <name>)
    shop/              Header, Footer, SearchBar, ProductCard, ProductGrid, PriceTag
    admin/             AdminSidebar
  lib/
    db.ts              Prisma client
    format.ts          formatPrice(), discountPercent()
    gst.ts             split GST-inclusive prices for invoices
    auth.ts            requireAdmin() – placeholder, blocks /admin in production until real auth exists
  server/
    queries/           read data for pages
    actions/admin/     server actions that change data (admin only)
  generated/prisma/    generated Prisma client (git-ignored, created by npm install)
```

## Conventions

- **Money is stored in paise** (whole numbers). Use `formatPrice()` to display it.
- **Next.js 16 uses Cache Components.** Anything that reads the database, `params`, `searchParams`
  or cookies must be inside a `<Suspense>` boundary — see `src/app/(shop)/p/[slug]/page.tsx`.
  The guides are in `node_modules/next/dist/docs/`.
- **Database changes:** only the person changing `schema.prisma` runs `npm run db:migrate -- --name <change>`
  and commits the new folder in `prisma/migrations/`. The other person pulls and runs `npm run db:migrate`.
- **Never commit `.env`.** Add new variable names to `.env.example`.
- Work on a branch (`feature/product-page`) and merge into `main` through a pull request.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | Check code |
| `npm run db:migrate` | Apply / create database migrations |
| `npm run db:seed` | Add sample brands, categories and products |
| `npm run db:studio` | Browse the database in the browser |
