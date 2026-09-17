# globeguard-frontend

Storefront for **GlobeGuard GmbH** (globeguard.ch): OBD vehicle diagnostic devices, licences, updates and accessories for motorhomes, overlanders and workshops. Headless frontend for the GlobeGuard Vendure backend (`globeguard-backend`).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 (CSS-first tokens in `src/app/[locale]/globals.css`), shadcn `base-vega` components on `@base-ui/react`
- next-intl 4: German at the root (`/`), English under `/en/` (`localePrefix: 'as-needed'`), messages in `messages/de.json` and `messages/en.json`
- gql.tada typed client against the Vendure Shop API (`src/lib/vendure/*`, schema types in `src/graphql-env.d.ts`)
- Font: Inter via `next/font` (light theme only)
- Orders are always in CHF; EUR is display-only

## Environment

Copy `.env.example` to `.env.local` and fill in the values. Required:

| Variable | Purpose |
| --- | --- |
| `VENDURE_SHOP_API_URL` | Vendure Shop API endpoint (server-side) |
| `VENDURE_CHANNEL_TOKEN` | Vendure channel token |
| `NEXT_PUBLIC_SITE_URL` | Public origin (no trailing slash). Inlined at build time for page metadata/canonicals, so it must be passed as a build arg; `sitemap.xml` and `robots.txt` are evaluated per request and read the runtime value (a host containing `beta.` disallows all crawling) |
| `NEXT_PUBLIC_SITE_NAME` | Site name (`GlobeGuard`) |
| `NEXT_PUBLIC_ASSET_HOST` | Hostname that serves Vendure assets (allowed for `next/image`) |
| `REVALIDATION_SECRET` | Secret for the `/api/revalidate` endpoint |

## Commands

```bash
npm install
npm run dev          # http://localhost:3001
npm run check-types  # tsc --noEmit
npm run lint         # eslint
npm run build        # next build (standalone output)
npm run start
```

Docker (local testing / Hetzner deployment; the image listens on port 3100, `npm run dev` on 3001):

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://globeguard.ch -t globeguard-frontend .
docker run -p 3100:3100 --env-file .env.local globeguard-frontend   # http://localhost:3100
```

`NEXT_PUBLIC_*` values are baked into the client bundle by `next build`, so `NEXT_PUBLIC_SITE_URL` must be passed as a build arg (one image per public host) even though `sitemap.xml` / `robots.txt` also read it at request time. Do not submit the sitemap to Search Console before the routes it lists exist (see `src/app/sitemap.ts`, `implemented`).

## Documentation

Project decisions, route map, merge inventory and phase plans live outside this repo in `C:/GlobeGuard/docs` (see `DECISIONS.md` there).
