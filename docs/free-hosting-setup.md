# Glabeekid Free Hosting Setup

This project can start on a free stack with:

- `Cloudflare` for the Next.js storefront
- `Render` for the Medusa backend/admin
- `Neon` for PostgreSQL
- `cron-job.org` for a 14-minute keep-alive ping to the free Render backend

## Important limitation

I can prepare the project and the deployment steps, but the external accounts
must be created and authenticated by you in:

- Cloudflare
- Render
- Neon

That is because those platforms require your login, email verification, and
sometimes CAPTCHA or billing confirmation.

## Ping endpoint

Use this public backend endpoint for keep-alive checks:

```text
/ping
```

Example production URL:

```text
https://your-render-backend.onrender.com/ping
```

Expected response:

```json
{
  "ok": true,
  "service": "glabeekid-medusa-backend",
    "route": "/ping",
  "timestamp": "2026-08-08T00:00:00.000Z"
}
```

## Service split

### 1. Neon

Create a free PostgreSQL project in Neon and copy the connection string.

Use that value as the backend `DATABASE_URL`.

### 2. Render

Create a free `Web Service` for `apps/backend`.

Suggested values:

- Runtime: `Node`
- Root directory: `apps/backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Set these environment variables in Render:

```env
DATABASE_URL=<your-neon-connection-string>
STORE_CORS=https://<your-cloudflare-storefront-domain>
ADMIN_CORS=https://<your-render-backend-domain>,http://localhost:9000
AUTH_CORS=https://<your-cloudflare-storefront-domain>,https://<your-render-backend-domain>,http://localhost:9000
JWT_SECRET=<strong-random-secret>
COOKIE_SECRET=<strong-random-secret>
AUTH_MFA_ENCRYPTION_KEY=<64-char-random-hex>
MASTER_ACCOUNT_EMAIL=reports@glabeekid.com
DEFAULT_OPERATIONS_ADMIN_EMAILS=admin@glabeekid.com
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY=glabeekid\\apps\\storefront
```

After first deploy:

1. open the admin
2. confirm the database migrated correctly
3. confirm your admin users still exist
4. verify `https://<backend-domain>/ping`

### 3. Cloudflare

Deploy `apps/storefront` on the free Cloudflare Next.js-compatible stack.

Set these storefront environment variables:

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<your-medusa-publishable-key>
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://<your-render-backend-domain>
NEXT_PUBLIC_DEFAULT_REGION=in
NEXT_PUBLIC_BASE_URL=https://<your-cloudflare-storefront-domain>
NEXT_PUBLIC_STRIPE_KEY=
MEDUSA_CLOUD_S3_HOSTNAME=
MEDUSA_CLOUD_S3_PATHNAME=
NODE_ENV=production
```

## Keep Render awake

Render free sleeps after 15 minutes of inactivity, so use `cron-job.org` to hit
the ping endpoint every 14 minutes.

### cron-job.org schedule

- URL:

```text
https://<your-render-backend-domain>/ping
```

- Method: `GET`
- Schedule: every `14` minutes

Suggested cron:

```text
*/14 * * * *
```

## Recommended order

1. Create Neon free project
2. Create Render free backend and connect Neon
3. Confirm backend admin and `/store/ping`
4. Create Cloudflare storefront project
5. Point storefront to the Render backend
6. Add cron-job.org keep-alive ping

## What I already prepared locally

- public keep-alive endpoints at [apps/backend/src/api/ping/route.ts](E:/projects/AI/glabeekid/apps/backend/src/api/ping/route.ts) and [apps/backend/src/api/store/ping/route.ts](E:/projects/AI/glabeekid/apps/backend/src/api/store/ping/route.ts)
- current backend/admin project
- current Next.js storefront
- India-first pricing, roles, analytics, and storefront customization

## What I still need from you

I need the actual account access or created service details for:

- Neon project / database URL
- Render service URL
- Cloudflare storefront URL

Once you create those free accounts, I can finish the deployment configuration
inside this codebase very quickly.
