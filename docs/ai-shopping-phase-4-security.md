# Agora AI Phase 4 security review

## Status

This phase adds local security controls and emulator-backed Firestore rules tests. It does **not** establish production readiness: no production project was queried, no rules/indexes/TTL policy were deployed, and no staging checkout, payment-provider, load, or edge-abuse test was run.

The read-only review found a shared customer-directory rule that allowed any signed-in user to read and update every `/customers/{id}` record. The client flow now stores those seller CRM records under `/sellers/{sellerId}/customers/{id}`, where the existing seller-owner rule applies; the legacy root collection is denied to clients.

The review also found mutable chat participants, review product IDs, notification recipients, and repair-request parties. Rules now keep those ownership/identity fields immutable after creation. Seller profile documents are publicly readable, so payment-gateway secret fields are now excluded from the public `Seller` type and blocked on seller create/update. Existing production seller documents still require an authorized data review and migration before deployment; Firestore rules cannot remove already-stored fields.

The pinned Next.js version was upgraded from 14.2.15 to 15.5.27 to address the middleware authorization-bypass advisory and patched server-component denial-of-service issues. Server Actions and async route/page request APIs were updated for the new major version. PostCSS was patched and Tailwind plus its animation plugin were moved to build-only dependencies. Buyer order and seller subscription payments now use server-initialized, server-verified Paystack flows. Payment fulfillment is idempotent, and seller clients cannot change subscription billing fields. Dependency remediation remains a separate task; review current audit output and upgrade dependency groups independently rather than applying force upgrades.

## Data flow and trust boundaries

```text
Browser goal / edit / selected listing IDs
    │  bounded schemas; submitted plan state is untrusted
    ▼
Next server action (planGroundedShopping / edit / refresh)
    │  derive optional identity from verified session cookie
    │  per-user rate counter (12/min); shared anonymous bucket (30/min)
    │  Firestore Admin reads; active seller/listing, stock, region and price filters
    ▼
Up to 8 current sanitized candidates ───────────► browser
    │                                             │
    │ model receives goal/preferences and         │ shopper explicitly selects
    │ eligible candidate count only               │ refreshed listing records
    ▼                                             ▼
Genkit structured output (Zod schema)        IndexedDB-only local cart
    │                                             │
    └─ summary is server-authored                 │ authenticated checkout request
                                                  ▼
                               Server reloads seller/product/price/stock
                               COD: transaction rechecks, decrements stock,
                               and writes seller orders
                               Paystack: server initializes amount; verified
                               callback rechecks price/stock before order write
                                                  │
                                                  ▼
                           Existing explicit checkout/payment boundary

AI has no cart, order, payment, account, seller-admin or Firestore-query tool.
```

The browser cart is a convenience store, not an authority. It is stored locally in the browser profile, is not synchronized to the server, and may remain visible to another person using that same profile; it is not a boundary for shared-device privacy. Checkout does not trust its price, stock, seller name, total, budget, or inventory claims. AI plan state is transient client state; the server reparses it and re-queries before selection refresh and before the planner's Add-to-cart action.

## AI permission matrix

| Capability | Access | Server authority | Status |
|---|---|---|---|
| Catalog search / plan narrative | Public read, bounded inputs | Server-authored queries, active seller/listing checks, per-minute limits; model receives no listing text or database IDs | Implemented |
| Edit plan / refresh selection | Public read, bounded text/state | Zod validation; fresh query; selected IDs must be current result IDs; server recalculates current total | Implemented |
| Add selected planner items to local cart | Explicit shopper click | Planner refreshes selected listings immediately before adding; checkout revalidates again | Implemented as client-local cart only |
| Persist/update saved plan | None | No saved-plan endpoint or collection exists | Not implemented |
| Create/modify a shared/server cart | None | No server cart mutation endpoint exists | Not implemented |
| Checkout, payment, order, refund, account, admin | Not exposed to the model | Existing authenticated APIs and payment provider flows | Not AI operations |

## Firestore rules inventory

Rules are in `firestore.rules`; collection-specific rules are not a substitute for authorization in Admin-SDK server code, which bypasses Firestore rules.

| Collection/path | Read | Create / update / delete | Important boundary or remaining concern |
|---|---|---|---|
| `users/{uid}` | Owner, admin, super-admin | Owner create/update with role/identity guards; owner or super-admin delete | Emulator test covers cross-user read/update denial. |
| `sellers/{uid}` | Public | Owner create/update; owner delete. Status, verification and balances are guarded; seller secret credential field is now rejected. | **Entire document is public.** Public email/phone/profile data may be exposed by design. Audit existing records for legacy secret fields before rollout. |
| Seller subcollections `customers`, `suppliers`, `repairRequests`, `stockAdjustments`, `payoutMethods`, `purchaseOrders` | Owning seller | Owning seller create/update/delete | Seller-isolation test covers seller CRM reads. Field schemas remain broad and should be narrowed separately for financial/customer records. |
| `sellers/{uid}/messages/{id}` | Owning seller | Owner create as self; owner update/delete | Message sender is checked on create. |
| Root `customers/{id}` | Denied | Denied | Legacy shared CRM path retired; client writer moved to seller-scoped CRM. |
| Root `repairRequests/{id}` | Buyer or owning seller | Buyer create; buyer/owning seller update with buyer/seller IDs immutable; super-admin delete | Emulator test covers seller reassignment denial. |
| `withdrawalRequests/{id}` | Super-admin or owning seller | Client writes denied | Backend-only. |
| `shops/{id}` | Public | Owner create/update/delete; super-admin delete | Owner ID immutable on update. |
| Root `products/{id}` | Public | Seller matching `sellerId` creates/updates; seller or super-admin deletes | Create/update validate basic price/stock types; Admin-SDK paths still require server validation. |
| `sellers/{uid}/products/{id}` | Public | Seller owner create/update/delete | Seller ownership checked; owner cannot edit another seller's listing (emulator test). |
| `categories/{id}` | Public | Admin/super-admin writes | |
| Root `orders/{id}` | Buyer, owning seller, admin/super-admin | Seller owner create; buyer or seller update with financial/order identity fields protected; delete denied | Server checkout APIs use the seller subcollection. |
| `sellers/{uid}/orders/{id}` | Seller owner or recorded buyer | Seller owner create/update with financial fields protected; delete denied | Buyer/seller identities are checked on read. |
| `payments/{id}` | Buyer, admin/super-admin | Client writes denied | Payment writes use server/provider flows. |
| `refunds/{id}` | Admin/super-admin | Client writes denied | |
| `chats/{id}` and `messages/{id}` | Participants | Participant-created chat requires exactly two distinct IDs including caller; updates cannot change participants; messages are sent as caller | Emulator test covers participant escalation. |
| `reviews/{id}` | Public | Buyer creates/updates/deletes own review; create/update validate rating/comment; update cannot change product or creation time | No purchase-eligibility check is encoded in these rules. |
| `wishlist/{uid}/items/{id}` | Owner | Owner writes | Emulator test covers cross-user read denial. |
| `notifications/{id}` | Recorded recipient | Admin creates; recipient updates without changing `userId`; super-admin deletes | Emulator test covers recipient reassignment. |
| `analytics/{id}` | Admin/super-admin | Super-admin writes | |
| `auditLogs`, `adminAuditLogs` | Super-admin | Client create/update/delete denied | Admin SDK only. |
| `sellerApplications/{id}` | Applicant, admin/super-admin | Marketplace user creates as self; super-admin updates/deletes | |
| `emailVerificationOtps/{id}` | Denied | Denied | Server-only. |
| `deliveries/{id}/events/{id}` | Buyer, rider, admin/super-admin | Delivery creates denied; constrained authenticated delivery updates; event writes denied | Delivery status transitions need staging validation. |
| `reports/{id}` | Reporter, admin/super-admin | Marketplace user create; super-admin update/delete | Report create schema/size is not constrained by rules. |
| `systemSettings/{id}` | Admin/super-admin | Super-admin write | |
| `adminUsers/{id}`, `staff/{id}` | Super-admin (staff self-create pending) | Super-admin; staff self-create is limited to pending role/status | |
| `aiShoppingRateLimits`, `aiShoppingToolAudit`, `apiRateLimits` | Client denied by default rule | Admin SDK only | TTL configured in `firestore.indexes.json`; deployment is not verified. |
| Unmatched collections, including saved plans and AI sessions | Denied by catch-all | Denied | No persistent plan/session collection currently exists. |

## Threat questions: control, test and result

| # | Threat | Current control | Test / result | Remediation or remaining work |
|---:|---|---|---|---|
| 1 | AI accesses another user's data | Model receives no user profile, cart, order, or seller-private data; no identity parameter | Firestore emulator cross-user tests pass; AI prompt source test passes | Keep private data out of future prompt/tool inputs. |
| 2 | AI modifies another user's cart | No AI cart tool; cart is browser-local | No server cart endpoint exists; checkout requires a verified session | If server carts are added, bind every operation to verified UID and test cross-user IDs. |
| 3 | AI invents an executable product ID | Only fresh server result IDs can be selected | Forged/stale selection unit test passes; checkout line parsing is tested | Firestore-backed candidate-query integration remains a staging test. |
| 4 | AI alters price | Model does not receive prices; checkout reloads listing price | Checkout price/total unit tests pass | Test price edits against Firestore emulator and payment provider in staging. |
| 5 | AI bypasses checkout | No order/checkout tool | Source permission boundary and checkout API reviewed | Keep checkout the sole order authority. |
| 6 | AI triggers payment | No payment tool | No AI operation calls payment API | Maintain explicit customer checkout action. |
| 7 | AI accesses payment credentials | No payment data is prompt context; payment secrets are server-side | Source review; no model data flow to Paystack | Verify deployed environment variables and logging configuration. |
| 8 | Seller content changes model instructions | Catalog-authored strings are absent from prompt; model gets aggregate count | Prompt-source regression test passes; live adversarial model test not run | Run model-provider staging tests with adversarial customer input. |
| 9 | Seller self-modifies trust signals | Seller rules preserve verification field; admin SDK is the approval path | Firestore emulator self-approval test passes | Audit existing verification values and approval audit trail in production. |
| 10 | Attacker creates unlimited AI/checkout requests | AI: 12/min per authenticated UID, 30/min in one anonymous global bucket. Checkout init/COD: 5/min per UID each | Limits are code-reviewed; no concurrent/load test | Add trusted edge/IP controls and alerting. Anonymous bucket is globally shared and can be exhausted by one attacker. |
| 11 | Attacker forces expensive search queries | Supported filters, page size 100, 500 candidates maximum, eight returned results | Pure limit tests pass; query indexes parse; no load/timeout test | Validate latency and index plans in staging; 500-document ceiling is still a bounded scan, not a long-term search index. |
| 12 | Stale product is added | Planner refreshes selected listings immediately before local-cart add; checkout rechecks active seller/listing, stock and price | Stale ID unit test passes; transactional checkout code reviewed | Exercise stock/deactivation race in staging/emulator. |
| 13 | Stale price reaches checkout or a forged Host changes payment callback | Server derives GHS subtotal; Paystack finalization compares current listing price and routes changes to review; callback URL uses validated `AGORA_APP_URL`, not request headers | Unit tests cover client amount mismatch/invalid money and trusted-origin parsing; finalizer integration not run | Test Paystack race, refund/manual-review operations end-to-end and configure the exact HTTPS production origin. |
| 14 | Customer manipulates budget | Planner recalculates selected totals from current candidates/prices; client totals are ignored | Plan-state unit tests pass | Plan budget is a planning preference, not a checkout spending limit; no saved signed plan is attached to checkout. |
| 15 | AI performs admin operation | No admin tool; customer AI server actions expose catalog reads only | Code review and deny-by-default rule | Keep administrative flows outside customer AI. |
| 16 | Model output executes a DB query | Structured output schema has bounded summary/questions/recommendation; no query or action fields | Schema/prompt inspected; no malformed-provider-response integration test | Validate provider schema behavior in staging. |
| 17 | Temporary AI data lives indefinitely | Rate-limit buckets/audit records have TTL fields and index overrides | JSON parses; emulator rules tests pass, but TTL is not simulated | Deploy and verify TTL policies; confirm audit retention policy with operations/legal. |
| 18 | AI failure claims success or fabricates products | Model failure returns explicit catalog-only fallback; product/price list is server-authored | Fallback path and candidate-only prompt inspected | Run provider outage test. |
| 19 | Another seller modifies a listing | Seller owner check on seller-scoped listing path | Firestore emulator test passes | Test every legacy root product writer before changing rules. |
| 20 | Customer changes review or delivery recipient ownership | Review product ID, notification recipient, repair buyer/seller IDs are immutable after create | Emulator tests pass for review/notification/repair; chat participant test passes | Review other field-level state transitions, especially orders and deliveries, against product workflows. |
| 21 | Private seller secret becomes public | `secretKey` removed from public type and blocked on seller create/update; payout methods are seller-scoped | Emulator test rejects client secret writes | **Production data check/migration required**: seller documents are public as a whole, and existing credentials cannot be ruled out locally. |

## Checkout and money handling

`checkout-pricing.ts` validates Firestore document IDs and integer quantities (1–99), rejects duplicate lines, non-finite/negative/excess-precision prices, invalid discounts and unsafe minor-unit totals. Submitted amount fields, when present, must match the server-calculated current subtotal; they are not authoritative. Currency is fixed to GHS. COD rechecks listing/seller status, integer stock and price within the stock/order transaction. Paystack order finalization checks the verified minor-unit amount against stored lines and detects price/stock changes before creating orders.

The local cart can contain stale or edited data by design. Checkout currently has no server-side cart record; authenticated checkout APIs use only seller/product IDs and quantities from the request, then reload authoritative data. The shopper must review refreshed prices and checkout before payment/order confirmation.

## Abuse controls, logs and retention

| Data / control | Policy in code | Deployment/operational status |
|---|---|---|
| AI rate limit | 12 calls/minute per verified UID; 30/minute shared anonymous bucket | Firestore Admin-SDK counter; no IP-aware limit or edge WAF configuration in repo |
| Checkout initialization | 5/minute per verified UID for Paystack init and COD separately | Firestore Admin-SDK counter |
| `apiRateLimits` | `expiresAt` at least one hour after current window | TTL override present; not deployed/verified |
| `aiShoppingRateLimits` | One-hour expiration | TTL override present; not deployed/verified |
| `aiShoppingToolAudit` | 90-day expiration; request ID, tool, signed-in actor UID when present, result, listing IDs, latency, error category; no prompt/IP | TTL override present; retention and access not verified in cloud |
| Checkout failures | Random request reference, route scope and error category; generic infrastructure errors to client | No alerting/aggregation pipeline configured here |
| Payment/order records | No TTL configured | Retain under marketplace/legal financial-record policy; do not add TTL without legal review |

There is no trusted proxy/IP configuration in this repository, so the anonymous global AI bucket is intentionally not keyed from caller-supplied forwarding headers. It is still vulnerable to bucket exhaustion; configure a trusted edge limit before production.

## Emulator tests and verification

Run:

```text
npm run test:ai-shopping
npm run test:checkout-security
firebase emulators:exec --only firestore --project demo-agora-security-tests "npm run test:firestore-rules"
npx tsc --noEmit
npm run build
```

The rules suite seeds isolated buyer/seller data with security rules disabled, then tests user/order/wishlist isolation, seller CRM/listing isolation, verification self-approval, legacy shared customer denial, chat participant escalation, review reassignment, notification reassignment, repair-party reassignment, and AI audit log denial. Checkout tests cover malformed IDs, duplicates, quantity bounds, price/currency/decimal/overflow cases, current discounts, and stale submitted totals.

At the Phase 4 checkpoint, 32 focused tests passed. Phase 5 extended local coverage; the latest `npm run test:security` run passed 45 tests (13 planner-state, 20 checkout/payment/environment, and 12 Firestore emulator rules), and `npx tsc --noEmit` plus `npm run build` passed. The 2026-10-05 production dependency audit reports 16 high and 64 moderate advisories; see [the Paystack staging-readiness report](./paystack-staging-readiness.md) for package triage and launch gates.

Not covered locally: Firestore search/index execution against representative catalog data, true API/auth/payment end-to-end calls, concurrent rate-limit load, emulator TTL expiry, malformed live model-provider responses, real prompt-injection behavior, card-provider race/refund handling, trusted-edge controls, alerts, existing production seller flags/secrets, or deployed index/rules status.

## Deployment gates

Do not claim production readiness until an operator:

1. Reviews seller verification values and approval audit provenance in the production project.
2. Searches seller documents for `customization.paymentGateway.secretKey`, migrates any such value to a server-only secret store, and verifies public profiles contain no credentials.
3. Deploys the rules/indexes and confirms composite index and TTL status in the intended Firebase project.
4. Runs the documented staging scenarios for buyer/seller isolation, stock/price races, Paystack webhooks, COD, rate limits, and model-provider failure.
5. Configures trusted edge/IP limits, monitoring and alerts for abuse, authorization failures and excessive invalid IDs.
6. Sets `AGORA_APP_URL` to the exact HTTPS production origin, and confirms other environment variables/secrets and audit retention policy without exposing secrets in logs.
