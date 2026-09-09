# Glabeekid

Glabeekid is a local Medusa + Next.js commerce workspace for a kids fashion brand focused on the India launch market. The project is scaffolded as a monorepo with:

- `apps/backend`: Medusa backend and admin
- `apps/storefront`: Next.js storefront

## Stack

- Node.js LTS `24.x`
- Medusa `2.18.0`
- Next.js `15`
- PostgreSQL
- npm workspaces + Turborepo

## Current Status

The project source has been scaffolded locally and rebranded from the generic Medusa starter to `Glabeekid`.

Included already:

- storefront, cart, checkout, customer account flows
- category and collection browsing
- product listing and product detail pages
- admin-ready Medusa backend
- India-first storefront defaults

Still needed before the app can run end to end on this machine:

- install Node.js `24.x` or `22.x` and use it for this repo
- install PostgreSQL and create the `glabeekid` database
- install project dependencies with `npm install`
- run Medusa migrations and create an admin user
- configure publishable API keys for the storefront

## Quick Start

### 1. Use Node LTS

This repo is pinned to Node `24` through `.nvmrc` and `.node-version`.

### 2. Create PostgreSQL database

Use a local database named `glabeekid` and set:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/glabeekid
```

### 3. Install dependencies

```bash
npm install
```

### 4. Backend setup

```bash
cd apps/backend
npx medusa db:migrate
npx medusa user -e admin@glabee.in -p ChangeMe123!
npm run dev
```

### 5. Storefront setup

Update `apps/storefront/.env.local` with your Medusa publishable key, then run:

```bash
cd apps/storefront
npm run dev
```

## Environment Defaults

### Backend

See `apps/backend/.env.template`.

### Storefront

See `apps/storefront/.env.local`.

## Business Assumptions

- launch market: India
- default storefront region: `in`
- planned shipping partner: India Post

## Shipping Note

India Post integration will likely be implemented as a custom Medusa fulfillment provider or a shipping-rate/order-sync adapter, depending on the API access and tracking workflow you want to use.

## Next Build Targets

- replace starter seed data with Glabeekid collections, categories, and kidswear products
- add custom product attributes for age group, fit, fabric, and occasion
- add wishlist and launch campaign content
- configure India shipping regions, INR pricing, and India Post shipping flows
- add custom CMS or content blocks for lookbooks and banners
