# Glabeekid Free Hosting Setup

This project can start on a free stack with:

- `Cloudflare` for the Next.js storefront
- `Render` for the Medusa backend/admin
- `Neon` for PostgreSQL
- `Cloudflare Workers Cron Triggers` for a 14-minute keep-alive ping to the free Render backend

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

Render free sleeps after 15 minutes of inactivity, so use the dedicated
Cloudflare keepalive Worker in [apps/keepalive-worker](E:/projects/AI/glabeekid/apps/keepalive-worker)
to hit the backend ping endpoint every 14 minutes.

### Default cron schedule

```text
*/14 * * * *
```

### Keepalive Worker settings

Set or keep these values in the Cloudflare Worker settings:

```env
KEEPALIVE_TARGET_URL=https://api.glabee.in/ping
KEEPALIVE_MODE=pause_at_night
KEEPALIVE_TIMEZONE=Asia/Kolkata
KEEPALIVE_SLEEP_START_HOUR=1
KEEPALIVE_SLEEP_END_HOUR=5
KEEPALIVE_FULL_TIME_DATES=
KEEPALIVE_FORCE_OFF=false
```

### What each setting does

- `KEEPALIVE_MODE=always`
  - ping every 14 minutes all day
- `KEEPALIVE_MODE=pause_at_night`
  - skip pinging during the configured night window
- `KEEPALIVE_SLEEP_START_HOUR=1`
  - start skipping at `1:00 AM`
- `KEEPALIVE_SLEEP_END_HOUR=5`
  - resume pinging at `5:00 AM`
- `KEEPALIVE_FULL_TIME_DATES=2026-08-15,2026-08-16`
  - optional override for specific India dates when you want full-time pinging
  - useful for sale days, catalog updates, or expected late-night traffic
- `KEEPALIVE_FORCE_OFF=true`
  - emergency switch to disable all keepalive pings without removing the cron

### Recommended usage pattern

- Normal days:
  - `KEEPALIVE_MODE=pause_at_night`
- Busy days when you want no night pause:
  - either set `KEEPALIVE_MODE=always`
  - or keep `pause_at_night` and add that date to `KEEPALIVE_FULL_TIME_DATES`

### Manual test routes

After deployment, the keepalive Worker exposes:

```text
/status
/run
```

Examples:

```text
https://<your-keepalive-worker-domain>/status
https://<your-keepalive-worker-domain>/run
```

- `/status`
  - shows whether the current run window would `ping` or `skip`
- `/run`
  - manually triggers one keepalive request to the backend

## Recommended order

1. Create Neon free project
2. Create Render free backend and connect Neon
3. Confirm backend admin and `/store/ping`
4. Create Cloudflare storefront project
5. Point storefront to the Render backend
6. Deploy the Cloudflare keepalive Worker

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
