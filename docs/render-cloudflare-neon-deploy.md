# Glabeekid Deployment Plan

This project is prepared for the following production setup:

- `Render` for the Medusa backend
- `Cloudflare Workers & Pages` for the Next.js storefront
- `Neon` for PostgreSQL

## Backend

Render service:

- Service type: `Web Service`
- Root directory: `apps/backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start:render`
- Health check path: `/ping`

Required backend environment variables:

```env
DATABASE_PROFILE=production
DATABASE_URL=postgresql://<neon-connection-string>
DATABASE_URL_PRODUCTION=postgresql://<neon-connection-string>
JWT_SECRET=<long-random-secret>
COOKIE_SECRET=<long-random-secret>
AUTH_MFA_ENCRYPTION_KEY=<64-char-random-hex>
MASTER_ACCOUNT_EMAIL=reports@glabeekid.com
DEFAULT_OPERATIONS_ADMIN_EMAILS=admin@glabeekid.com
PORT=10000
STORE_CORS=https://glabeekid.com,https://www.glabeekid.com
ADMIN_CORS=https://api.glabeekid.com
AUTH_CORS=https://api.glabeekid.com,https://glabeekid.com,https://www.glabeekid.com
```

## Storefront

Cloudflare project root:

- `apps/storefront`

Cloudflare build command:

```bash
npm install
npm run cf:build
```

Cloudflare deploy command:

```bash
npm run cf:deploy
```

Required storefront environment variables:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.glabeekid.com
NEXT_PUBLIC_BASE_URL=https://glabeekid.com
NEXT_PUBLIC_DEFAULT_REGION=in
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable-key-from-medusa-admin>
```

Notes:

- The storefront build fetches live Medusa data during static generation.
- Deploy the backend first and make sure the backend URL is reachable before the storefront build runs.
- Create the Medusa publishable key in admin before final storefront deployment.

## Domains

Recommended domain split:

- `glabeekid.com` -> Cloudflare storefront
- `www.glabeekid.com` -> Cloudflare storefront
- `api.glabeekid.com` -> Render backend
