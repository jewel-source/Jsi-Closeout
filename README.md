# Jewel Source — Closeout Jewelry Catalog

A Next.js site that showcases closeout jewelry (photos + descriptions pulled from
Seafile spreadsheets and photos.jsi.studio) and lets customers pick pieces and
submit a quote request that emails info@jewelsource.inc.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Catalog data: generated JSON built from Seafile Excel sheets + matched photos
- Quote requests: submitted client-side to [Web3Forms](https://web3forms.com) (no backend to host)

## Getting started

```bash
npm install
npm run dev
```

The site runs immediately against `src/data/catalog.sample.json` (4 placeholder
items) so you can see the layout before hooking up real data.

## Connecting real data

1. Copy `.env.example` to `.env` and fill in the values (see comments in that file
   for what each one does):
   - `SEAFILE_SERVER_URL`, `SEAFILE_REPO_ID`, `SEAFILE_FOLDER_PATH` — where the
     closeout Excel files live. The repo ID and folder path are already filled in
     from the library you shared; double check `SEAFILE_FOLDER_PATH` matches the
     exact folder once you're inside Seafile.
   - `SEAFILE_API_TOKEN` **or** `SEAFILE_USERNAME` + `SEAFILE_PASSWORD` — to get a
     token, log into Seafile → Settings → "Auth Token", or the import script will
     fetch one for you from a username/password.
   - `IMMICH_BASE_URL` + `IMMICH_API_KEY` — photos.jsi.studio is an
     [Immich](https://immich.app) server. The importer searches it by filename
     (style number) at import time; actual image bytes are then served live
     through `src/app/api/immich-image/[id]/[size]/route.ts`, which attaches the key
     server-side on each request. **The key is never sent to the browser**
     (it can read your whole library, so don't add a `NEXT_PUBLIC_` prefix to
     it, and don't wire it into client-side code) — but because images are
     proxied live rather than downloaded at import time, **`IMMICH_BASE_URL`
     and `IMMICH_API_KEY` must also be set in your production server
     environment**, and photos.jsi.studio must be reachable from it for
     images to load. Get a key from Immich under Account Settings → API Keys.
2. Run the importer:
   ```bash
   npm run import-catalog
   ```
   This downloads every `.xlsx`/`.xls` file under `SEAFILE_FOLDER_PATH`, reads
   **every sheet tab** in each workbook (not just the first — some files split
   e.g. "Mens Jewelry" or "Station Necklaces" into their own tabs). It matches columns like Style #, Desc,
   Metal, Gem, Qty, Price (the plain `Price` column, or `TAG Price` in the srj
   samples file — never the internal `Cost` column) (case-insensitive, several header spellings supported
   — see `COLUMN_ALIASES` in `scripts/import-catalog.ts`), searches Immich for
   each style's photos (edit-distance matching against the photo's own filename
   code, tolerant of dropped/typo'd characters and inconsistent naming, but
   rejecting ambiguous or implausibly-shared matches rather than guessing — see
   `scripts/lib/immich.ts`), and writes `src/data/catalog.json` with each photo
   pointing at `/api/immich-image/<asset-id>`.
   The site automatically prefers this file over the sample data once it
   exists. Two style numbers landing on the same generated id (a duplicate row
   within one sheet, or the same style repeated across sheets) are handled
   automatically — same-file duplicates are merged into one listing (with
   quantity summed across in-stock rows),
   and the same style appearing in different source files with
   identical details (description, metal, size, category, stone, weights) is
   de-duplicated to a single listing — the in-stock one wins over a sold one,
   then the one that has a price. A style whose details genuinely differ
   between files is kept as separate listings with a disambiguated id
   (`style`, `style-2`, ...). The end of the import logs how many of each it did.
   **Sold vs. in stock:** a row is sold when both `Company` and `Memo/Invoice`
   are filled, the quantity is 0, or the whole file has "sold" in its name.
   Rows whose Style cell is a note rather than a style number (e.g. "JB01029BT8
   - DUPLICATE ONLY FOR RECORDS", "ALL SHIPPED") are skipped. Sold pieces stay in
   the catalog because they can be reordered, but they live on a separate
   **Sold Out** tab and show only a price. **In Stock** pieces show price and
   quantity. A style with any in-stock row counts as in stock.
3. **Sheets like `SILVER GEMSTONE.xlsx` don't have a customer-facing name or
   description column** — just an internal `Desc` field like
   `SS 25.50GTW AQ BRACELET 7.5"`. `scripts/lib/parse.ts` parses jewelry type,
   gem name, and size out of that text and decodes Metal/Gem codes (`SS` →
   "Sterling Silver", `AQ` → "Aquamarine", etc.) into the generated name/description.
   Its `GEM_CODE_MAP`/`METAL_CODE_MAP` are a **starter, conservative list** —
   after each import the script prints any gem codes it didn't recognize (left
   as raw codes rather than guessed) so you can add them and re-run. **Review
   `src/data/catalog.json` before publishing** — gem naming is customer-facing
   and this is generated text.
4. **First run will likely need column-mapping tweaks.** The script logs a
   warning with the exact headers it saw if it can't find a style/SKU column.
   Open `scripts/import-catalog.ts` and add your sheet's actual header names to
   `COLUMN_ALIASES`.
5. `src/data/catalog.json` **is committed to git** (not gitignored) — see
   "Automated daily refresh" below for why. Re-running `npm run import-catalog`
   locally regenerates it; commit the change like any other file if you want
   it live before the next scheduled refresh.

## Automated daily refresh

`.github/workflows/refresh-catalog.yml` re-runs the importer once a day
(5am UTC) and commits `src/data/catalog.json` if it changed — so edits to the
Seafile spreadsheets (new styles, price/qty changes, etc.) show up
automatically without anyone manually re-running anything. Since
`catalog.json` is a committed file rather than a gitignored build artifact,
any host that deploys on push to `main` (Vercel's default behavior) picks up
each day's refresh with zero extra host-side configuration.

**Photo matching is cached**, not fully redone every run: each import seeds a
cache from the *previous* `catalog.json` (style number → already-matched
photos) and only calls Immich's search for styles that are new or that had
no match last time — a style that already resolved successfully isn't
re-searched. This keeps daily runs fast and light on Immich instead of
re-querying it for ~1,400+ unchanged items every day. The trade-off: if you
add a *new* photo in Immich for a style that already has at least one
matched photo, that won't be picked up automatically (a style with zero
matches will still retry every run). To force a full re-search — e.g. after
reorganizing/renaming photos in Immich — trigger the workflow manually from
the Actions tab (`workflow_dispatch`) with "force_photo_refresh" checked, or
run `FORCE_PHOTO_REFRESH=true npm run import-catalog` locally.

Setup (one-time): add these as **repository secrets** (Settings → Secrets and
variables → Actions), using the same values as your local `.env`:
`SEAFILE_SERVER_URL`, `SEAFILE_REPO_ID`, `SEAFILE_FOLDER_PATH`,
`SEAFILE_USERNAME` + `SEAFILE_PASSWORD` (or `SEAFILE_API_TOKEN`),
`IMMICH_BASE_URL`, `IMMICH_API_KEY`, and optionally `MAX_PHOTOS_PER_ITEM` /
`IMMICH_THUMBNAIL_SIZE`.

Note this only refreshes the *data*. The live site's `/api/immich-image` proxy
separately needs `IMMICH_BASE_URL` / `IMMICH_API_KEY` set as environment
variables on whatever host runs the app (see Deployment below) — the GitHub
Actions secrets and the host's env vars are two different places holding the
same values.

## Quote requests

The "Quote Request" page collects the customer's selected items (kept in
`localStorage` via `QuoteCartContext`) plus a short contact form, and posts it to
Web3Forms, which emails the submission to whatever inbox owns the access key.

Setup:
1. Go to https://web3forms.com and create a free access key using
   `info@jewelsource.inc`.
2. Put the key in `.env` as `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`.

Until that key is set, the form shows a clear inline error instead of silently
failing.

## Deployment

Any Vercel/Netlify-style Node host works (`next build && next start`, or just
point Vercel at the repo) — a live Node server is required, not a static
export, since `/api/immich-image` and the quote form run server-side. Set the
same env vars from `.env` in the host's dashboard, **including `IMMICH_BASE_URL`
/ `IMMICH_API_KEY`**, which the image proxy needs at runtime, not just at
import time. `src/data/catalog.json` doesn't need a separate deploy step —
it's a committed file kept fresh by the daily GitHub Action (see above), and
any host that deploys on push to `main` (Vercel's default) picks it up
automatically.

## Project structure

```
.github/workflows/refresh-catalog.yml   Daily scheduled re-import (commits catalog.json)
scripts/import-catalog.ts    Seafile + Immich search -> catalog.json importer
scripts/lib/immich.ts        Immich filename search (used at import time)
src/app/api/immich-image/[id]/[size]/route.ts   Live image proxy (attaches IMMICH_API_KEY server-side)
src/lib/catalog.ts           Reads catalog.json (falls back to sample data)
src/lib/types.ts             JewelryItem / QuoteRequestItem types
src/context/QuoteCartContext.tsx   Client-side "selected items" cart (localStorage)
src/app/page.tsx             Catalog grid + category filter
src/app/jewelry/[id]/page.tsx Product detail page
src/app/quote/page.tsx        Quote review + submission form
```
