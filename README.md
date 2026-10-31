# AOT.ng

Website for AOT.ng, a modest fashion brand in Ilorin. Modest. Elegant.You

It's a static Next.js site with one Cloudflare Worker. The Worker receives orders and emails them to the owner through Resend. There's no database.

## Order updates

Customers get an "Order received" email automatically. The owner's order email has a button for each later step, such as payment received, out for delivery, or cancel. Each button opens a page to confirm, then emails the customer from orders@aotwears.store.

The buttons carry the order details in a signed link, so nothing is stored. `ORDER_ACTION_SECRET` signs them. Changing that secret stops the buttons in older emails from working, and links expire after 120 days.

## Updating products

Everything lives in `src/data/products.ts`, with the options explained at the top of the file.

- **Price:** change `price`. To show a sale, set `compareAtPrice` to the old price.
- **Stock:** change `availability`. For limited pieces, lower `remaining` after each confirmed order.
- **Photos:** put files in `public/products/` and list them in `images`, such as `"/products/abaya-1.jpg"`. Resize them first, because the site serves them as they are.

Run `npm run deploy` to publish. The Worker reads the same file, so a customer can't order at an old price or buy something marked sold out.

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

## Checks

```bash
npm run typecheck
npm run lint
npm test
```
