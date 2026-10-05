# Agora AI shopping: Phase 3 boundaries

## Data flow and plan state

The shopper's goal and edits are validated on a server action. The action derives no user identity from model or client-supplied IDs; a verified Firebase session is used only for per-user rate limiting and audit attribution. It queries active product listings with positive stock, filters active parent sellers, and returns at most eight sanitized current candidates. Category matches use Firestore filters and cursor pages of 100, with a hard ceiling of 500 and a visible incomplete-search notice when reached.

The serializable plan state retains the original goal and budget, current constraints, must-haves, owned items, seller/brand/price preferences, selected product IDs, edit history, questions, assumptions, current total, and remaining budget. The browser state is untrusted: every edit and selection is validated and searched again on the server. Only current candidate IDs and current server prices may contribute to a selected total. Totals are rounded server-side; a selection that exceeds the stated budget is cleared. Checkout remains responsible for its existing authoritative price and stock validation.

## Tool permission matrix

| Tool | Purpose and input | Output / data exposed to AI | Authentication and authorization | Confirmation | Rate limit and audit |
|---|---|---|---|---|---|
| Catalog search (`planGroundedShopping`) | Validate a bounded goal, optional GHS budget, preferences and must-haves | The model receives only the count of eligible candidates. Real IDs, names, prices, stock, seller data and specifications are returned separately to the shopper and never sent to the model | Public catalog read; active listing and seller checks on the server. Optional verified session UID is derived from the session cookie, never accepted as an argument | None; read-only | 12 calls/minute per signed-in UID; 30 calls/minute shared anonymous bucket. Audits request ID, tool, actor UID when authenticated, result, listing IDs, latency and error category; does not record prompts or IP addresses |
| Plan edit (`editGroundedShoppingPlan`) | Validated plan-state snapshot and a text edit of up to 500 characters | Same fresh catalog candidate subset as search; client state is revalidated and never treated as price/stock authority | Same public catalog read; strict server schema; user IDs and arbitrary resources are not accepted | None; read-only | Same limits and structured audit event |
| Selection refresh (`refreshGroundedShoppingSelection`) | Validated plan state and at most eight proposed listing IDs | Fresh current candidate facts, server-validated selected IDs, total and budget remainder | Same public catalog read; only IDs returned by the fresh catalog query can be selected | Shopper explicitly selects/deselects products | Same limits and structured audit event |
| Add to cart | Customer clicks “Add selected to cart” | The selected current listing records only | Existing client cart remains customer-controlled; it is not an AI tool. Checkout reloads and validates sellers, listings, stock and price | Explicit shopper click; normal checkout remains separate | No AI cart/order tool audit because the model cannot invoke cart actions |
| Checkout, payment, orders, account/admin | Not exposed to Agora AI | No such data is sent to the model | Existing application authorization and checkout/payment flows remain the authority | Normal explicit checkout/payment confirmation | Outside this AI tool set |

Audit and rate-limit documents are Admin-SDK-only; Firestore's deny-by-default rule blocks client access. The rate-limit buckets and audit events carry `expiresAt` fields with TTL field overrides in `firestore.indexes.json`; deploy those indexes and TTL policies. Anonymous calls share a bucket rather than persisting IP addresses.

## Trust, delivery and compatibility

- `isVerifiedArtisan` is the only seller verification signal used as a verification filter; an unverified seller is not described as unsafe.
- `regionId` is seller location only. A request for a seller's location can filter by that field, but a request for delivery to a region is retained as a request and not treated as proof of delivery coverage.
- Compatibility is `unknown` until Agora has an explicit, tested compatibility rule or verified compatibility data. Listing specifications are seller-provided and shown as unverified.
- Product explanations separate live price/stock/seller fields from relevance reasoning. The model does not authoritatively classify products, compatibility, delivery, or totals.
- Product names, seller names, descriptions, specifications, reviews and uploaded content are untrusted. No marketplace-authored text is placed in the model prompt; the model receives only a server-generated candidate count. Its summary is replaced with server-authored catalog status.

## Search and remaining limits

Category inference narrows the Firestore collection-group query where possible. Queries filter active status and positive stock, apply both regular-price and discount-price ceiling branches when a budget is supplied, use composite indexes, and page with cursors instead of scanning a single unfiltered first page. Results from the two price branches are deduplicated and still capped at 500 candidate records per call; the UI warns when the cap is reached. Firestore does not provide general full-text search, so broad/unclassified goals can still reach this cap. A dedicated indexed search service or maintained token index is a future migration before very large catalogs; simply increasing the cap is not the scaling strategy.

Seller self-service Firestore rules now prevent creating or changing the `isVerifiedArtisan` verification value; Admin-SDK workflows can still manage it. Deploy the updated rules and indexes, and review existing verification values before using the filter in production.

## Validation

Run `npm run test:ai-shopping`, `npx tsc --noEmit`, and `npm run build`. The focused tests cover edit preservation, budget enforcement, forged/stale selection IDs, seller/delivery distinctions, injection-like edits, compatibility uncertainty, bounded search/tool limits, and the absence of marketplace-authored text from the model prompt. Firestore integration, deployment TTL behavior, edge-level anonymous abuse controls, and model prompt-injection behavior still require staging/emulator validation.
