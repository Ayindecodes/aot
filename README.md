# AOT.ng

Website for AOT.ng, a modest fashion brand in Ilorin. Modest. Elegant.You

It's a static Next.js site with one Cloudflare Worker. The Worker receives orders and emails them to the owner through Resend. There's no database.

## Order updates

Customers get an "Order received" email automatically. The owner's order email has a button for each later step, such as payment received, out for delivery, or cancel. Each button opens a page to confirm, then emails the customer from orders@aotwears.store.

The buttons carry the order details in a signed link, so nothing is stored. `ORDER_ACTION_SECRET` signs them. Changing that secret stops the buttons in older emails from working, and links expire after 120 days.

## Updating products

Log in at `/admin` to add, edit or remove products. Saving commits `src/data/catalog.json` and any photos to GitHub, and that push runs `.github/workflows/deploy.yml`, which tests, builds and deploys the site in about 3 minutes.

The Worker reads the same catalogue, so a customer can't order at an old price or buy something marked sold out. The field options are explained at the top of `src/data/products.ts`.

The admin needs these Worker secrets: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and `GITHUB_TOKEN`, a fine-grained token limited to this repo with read and write access to contents. The deploy workflow needs `CLOUDFLARE_API_TOKEN` as a GitHub Actions secret.

Business details such as the bank account, phone number and delivery fees are in `src/data/business.ts`.

## Before launch

1. Give the Coming soon pieces real prices and details, or remove them. Set `openToSearchEngines` to true in `src/data/business.ts` so search engines can list the site.
2. Replace the wordmark in `src/components/Logo.tsx` and `src/app/icon.svg` with the real logo.
3. Set `tiktokUrl` in `src/data/business.ts`.
4. Set the secrets with `npx wrangler secret put` for `RESEND_API_KEY`, `ORDER_ALERT_EMAIL`, `ORDER_ACTION_SECRET` and `TURNSTILE_SECRET_KEY`.
5. Send a real test order and confirm it reaches the owner's inbox, not spam.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run preview      # site and order Worker, with emails printed to the terminal
npm run dev          # site only, so orders won't submit
```

The bot check only works on aotwears.store, so checkout can't be submitted locally.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```
