# Local Setup Notes

As of August 1, 2026, the repo is partially prepared for local startup:

- a portable Node `24.18.1` runtime was downloaded into `E:\projects\AI\tools`
- PostgreSQL `18` is present locally and the `glabeekid` database was prepared
- the remaining blocker is dependency installation and first app boot

## Recommended local prerequisites

1. Use Node.js `24.x` LTS for this repo.
2. Ensure PostgreSQL `18` is running locally.
3. Complete workspace dependency installation.
4. Run Medusa migrations and create the admin user.

## Expected environment values

Backend:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/glabeekid
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000
```

Storefront:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_DEFAULT_REGION=in
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

## Recommended next commands

```bash
npm install
cd apps/backend
npx medusa db:migrate
npx medusa user -e admin@glabeekid.com -p ChangeMe123!
npm run dev
```
