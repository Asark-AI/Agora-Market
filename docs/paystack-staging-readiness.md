# Paystack staging and production-readiness gate

**Assessment date:** 2026-10-05
**Decision:** Not production-ready. Do not switch Paystack to live mode and do not add autonomous purchasing.

## Evidence and limits

Local code/tests can verify server-side calculations, signature checking, and Firestore rules, but cannot prove a real Paystack transaction, Paystack dashboard configuration, deployed Firebase isolation, payment-provider callbacks, or production operations. No staging Paystack transaction or Ghana Mobile Money transaction was run for this assessment. No staging/live credentials were read. The local repository does not provide evidence that a separate staging Firebase project, URL, webhook, backup, or alerting pipeline has been provisioned.

The staging template is [.env.staging.example](../.env.staging.example); it contains placeholders, not credentials. Configure the values only in the staging deployment secret manager, then run `npm run check:staging-env` in that deployment's environment. The check never prints values. It requires:

- `AGORA_ENVIRONMENT=staging` and `PAYSTACK_MODE=test`, with matching `sk_test_` and `pk_test_` keys.
- An HTTPS staging origin distinct from `AGORA_PRODUCTION_APP_URL`.
- Matching web and Admin Firebase project IDs, distinct from `AGORA_PRODUCTION_FIREBASE_PROJECT_ID`.
- No payment or Firebase Admin secret under a `NEXT_PUBLIC_` name.

Paystack initialization is disabled unless `AGORA_ENVIRONMENT` and `PAYSTACK_MODE` explicitly match their key prefixes. Development/staging only accept test keys; production only accepts live keys. Firebase web initialization now fails closed when required client configuration is missing instead of silently selecting the repository's previous project defaults. The Admin SDK must independently be configured for the same stage project.

## Local verification record

The Phase 4 baseline reported passing security tests, TypeScript, and production build. Phase 5-specific local changes add checkout rejection for unsupported/tampered currency and client-supplied shipping/discount/final totals, initialize a server payment intent before calling Paystack, add safe webhook/verification event logs, and test the environment guard. The verification commands for the current worktree are:

```text
node --experimental-strip-types --test tests/payment-environment.test.mts tests/checkout-security.test.mts tests/paystack-payment-validation.test.mts
npm run test:security
npx tsc --noEmit
npm run build
git diff --check
```

Local unit tests do not emulate the Paystack API or execute the Admin-SDK payment finalizers against a Firestore emulator. The Firestore rules tests prove rules decisions, not production rules deployment.

## Transaction boundary and inventory policy

The client submits seller/product IDs and quantities. Server checkout reloads seller status, product status, current product price, discount price, and stock. Amounts are integer GHS minor units. Currency is fixed to GHS. Unrecognized client monetary fields such as shipping, discount, delivery fee, and final total are rejected; those features are not currently part of the Paystack amount calculation. The callback URL comes from the configured `AGORA_APP_URL`, not a request Host header.

Inventory is **not reserved** before payment. Initialization creates a pending payment intent but does not decrement stock. After Paystack success is independently verified, the finalizer transaction checks current stock and current price, creates each seller order, and decrements stock in the same transaction. Failed/cancelled/pending attempts do not decrement inventory. If the paid product became unavailable or changed price, the payment is recorded as received and the order is held for manual review; it is not made fulfillment-ready automatically. This requires an operational review/refund process before accepting real customers.

The finalizer uses a stable payment reference for its order IDs, financial ledger record, and audit entry, and rechecks existing orders/records inside a Firestore transaction. This is implementation evidence for replay safety; a repeated-event Admin-SDK integration test and real duplicate webhook exercise have not been run. Separate checkout initializations use separate references and can create separate charges; the checkout currently has no cross-attempt idempotency key. That is a remaining duplicate-charge risk to resolve before a high-volume launch.

## Scenario results

| Scenario | Local evidence | Staging result |
|---|---|---|
| Buyer amount / price / total tampering | Pricing unit tests verify server-derived price and reject mismatching totals, currency, shipping/discount/final-total fields. | Not run |
| Quantity tampering | Bounds, duplicate lines, and stock revalidation are implemented. Quantity is intentionally shopper-selected; no signed cart snapshot exists. | Not run |
| Successful/failed/cancelled/pending card payment | Status handling exists in authenticated verification; no end-to-end provider test. | Not run |
| Ghana Mobile Money | No evidence the account's MoMo channels are enabled; no MoMo test transaction. | Not run |
| Callback refresh / duplicate callback | Callback invokes authenticated server verification; finalization keys are stable. No browser/provider replay test. | Not run |
| Webhook signature | HMAC-SHA512 over exact raw payload is unit-tested for valid, missing, invalid, and altered payload bytes. Route-level request test not present. | Not run |
| Duplicate/unknown webhook | Duplicate finalization is transaction/idempotency guarded; unknown payment intent returns retryable 503. | Not run |
| Paystack success with wrong amount/currency/reference | Pure mismatch helper is unit-tested; order/subscription finalizer emulator integration not run. | Not run |
| Provider verification outage | Route returns an error and does not mark payment successful; no fault-injection test. | Not run |
| Seller subscription price/ownership | Server owns Premium at GHS 50 / 5000 minor units; authenticated initialize/verify and seller-owner checks are implemented. | Not run |
| Renewal / plan changes | Basic downgrade is server-authorized. Already-Premium initialization is rejected; renewal is not implemented. | Not run |
| Firestore buyer/seller isolation | Emulator tests cover buyer-owned payment reads, cross-buyer denial, client payment-write denial, seller billing-field denial, and private collection denial. | Not deployed/verified |
| Refund/reversal | No refund endpoint or reversal finalizer exists. A low-level unused provider refund helper is not a refund workflow. | Not run |

### Paystack test record

No real test-mode transaction was attempted, so there are no transaction IDs/references, amounts, provider results, or webhook deliveries to report. Do not create test records from mock data and describe them as provider transactions.

## Refunds and reconciliation

Refunds, reversals, chargebacks, and partial refunds are **production blockers**. No authorized refund API or operator workflow currently records the provider refund, adjusts order/payment state, reverses seller earnings, or reconciles partial amounts. Do not call the unused provider helper from a client or grant payment/refund tools to the AI.

Reconciliation should be an authenticated, server-only scheduled job or operator command, not a client endpoint:

1. Query Agora payment intents in `INITIALIZING`/`PENDING` beyond a defined age and all `MISMATCH`/`REVIEW_REQUIRED` records.
2. Verify each known reference with Paystack using the secret from the deployment secret manager. Never search or mutate transactions using a client-supplied amount.
3. Compare provider status, reference, amount, currency, transaction ID, Agora payment intent, and linked order IDs.
4. Emit a structured discrepancy event and create a review case. Preserve both provider and Agora observations; do not silently overwrite terminal states or mark an order paid solely from an unverified event.
5. For provider-success/Agora-pending, call the same idempotent finalizer after verification. Provider-success/Agora-failed is a manual-review case; provider-failed/Agora-paid is a high-severity discrepancy that freezes fulfillment/settlement pending investigation.
6. Record operator identity, decision, before/after state, and idempotency key. Any refund/reversal must have its own authorized provider operation and ledger reversal.

This reconciliation mechanism is a design only. There is no scheduled worker, alert, review queue, or tested reconciliation command in this repository.

## Dependency remediation report

`npm audit --omit=dev` on 2026-10-05 reported **16 high, 64 moderate, 0 critical**. The high entries below are transitive unless marked direct; versions are from the current lockfile. “Fix available” is npm's current audit metadata, not a claim that a change was tested. Exploitability is not proven by the audit result alone.

| Package (current) | Severity / advisory class | Direct? / route into Agora | Fix / risk | Recommended action and Agora impact |
|---|---|---|---|---|
| `@fastify/busboy` 3.2.0 | High; oversized/malformed multipart DoS | Transitive via `firebase-admin` and Genkit optional adapters | npm reports a compatible fix; low-to-medium risk | Update the transitive resolution in an isolated Admin/Genkit dependency change. Exercise Firebase Admin operations and Genkit. |
| `@firebase/firestore` 4.7.3 | High; audit associates affected Firestore dependency tree with vulnerable gRPC/Undici versions | Transitive through direct `firebase` 10.14.1 | No automatic fix reported; medium/high compatibility risk | Upgrade Firebase client/Admin groups only after Auth, Firestore listeners, checkout rules emulator, and admin access tests pass. It is in the browser app's Firestore path. |
| `@firebase/firestore-compat` 0.3.38 | High; affected compat Firestore tree | Transitive through Firebase 10.14.1 | No automatic fix reported; medium risk | Determine which Firebase compat paths are required; do not remove or override without import/use review and emulator tests. |
| `firebase` 10.14.1 | High; audit reports dependency advisory | Direct runtime dependency used for client Auth/Firestore/Storage | No automatic fix reported; major-group risk | Prioritize a supported Firebase upgrade; stage it with auth, checkout, seller, and Firestore-emulator regression tests. |
| `@grpc/grpc-js` 1.14.4 (several nested copies) | High; unauthorized certificate acceptance in some configurations and server error disclosure | Transitive via Firebase Admin/Google Cloud/Genkit; a separate 1.9.16 copy is outside the reported affected range | No global automatic fix reported; medium/high risk | Inspect each `google-gax`/Admin range and update the Firebase Admin/Genkit cloud chain together. The findings concern server gRPC surfaces, not Paystack HMAC logic. |
| `@genkit-ai/core` 1.39.0 | High; Genkit advisory | Transitive from direct `genkit` and `@genkit-ai/google-genai` | No automatic fix reported; high compatibility risk | Review upstream advisory and upgrade Genkit packages as a matched set; test planner schema/fallback and provider calls. |
| `@genkit-ai/firebase` 1.39.0 | High; Genkit Firebase adapter advisory chain | Optional/transitive from Genkit | No automatic fix reported; medium risk | Confirm whether the adapter is loaded in deployed production; remove only if unused, otherwise update with the Genkit group. |
| `@genkit-ai/google-cloud` 1.39.0 | High; Genkit Google Cloud adapter chain | Optional/transitive from Genkit Firebase adapter | No automatic fix reported; medium risk | Verify whether this adapter and associated logging/Model Armor paths are enabled. Update as a group; not a payment integration. |
| `@opentelemetry/auto-instrumentations-node` 0.49.2 | High; malformed HTTP input may crash exporter process | Optional/transitive through Genkit Google Cloud | No automatic fix reported; medium risk | Remove optional instrumentation if unused or update Genkit telemetry dependencies; exercise app startup and tracing. |
| `@opentelemetry/sdk-node` 0.52.1 | High; process-crash advisory chain | Transitive through Genkit core/cloud | No automatic fix reported; medium risk | Coordinate telemetry SDK updates; confirm whether instrumentation is enabled in production. |
| `@opentelemetry/propagator-jaeger` 1.25.1 | High; malformed header can cause DoS | Transitive through OpenTelemetry SDK Node | No automatic fix reported; low-to-medium risk | Upgrade telemetry as a compatible set or remove Jaeger propagator if unused; validate traces. |
| `@opentelemetry/sdk-trace-node` 1.25.1 | High; affected telemetry dependency chain | Transitive through Genkit/OpenTelemetry | No automatic fix reported; medium risk | Upgrade with Genkit/OpenTelemetry group and test AI/API telemetry startup. |
| `brace-expansion` 2.1.2 | High; expansion DoS | Transitive via Google Cloud/Genkit; a separate dev-only 5.0.9 copy is not the affected copy | npm reports a fix; low risk if lock-only resolution stays compatible | Update the affected transitive copy and rerun audit/security/build. |
| `fast-uri` 3.1.3 | High; host confusion/SSRF and authority normalization issues | Transitive via `ajv` in Genkit core | npm reports a fix; low-to-medium risk | Update compatible transitive resolution; run Genkit schema and server request tests. |
| `postcss` 8.4.31 (nested under Next.js) | High; CSS output/source-map disclosure advisories | Transitive under direct Next.js 15.5.27; direct PostCSS 8.5.28 is not the affected version | npm proposes Next 16.3.8 (major); high framework/build risk | Do not force-upgrade Next. Test a dedicated Next major upgrade and production CSS/build output. |
| `undici` 6.19.7 | High; HTTP/WebSocket parsing, response-smuggling, and resource-exhaustion advisory family | Transitive in Firebase/Google Cloud/Genkit tree | No automatic fix reported for the complete tree; medium/high risk | Trace each importer and update owning SDK groups; include request-boundary tests. Do not apply a blanket override. |

This is a triage report, not a claim that all advisories are exploitable in Agora. In particular, optional adapters may not be loaded, and protocol-specific findings require their vulnerable surface/configuration. No dependency upgrade was performed as part of this phase because the affected Firebase, Genkit, and Next groups have application/API compatibility risk.

## Paystack Dashboard deployment checklist

Configure the Paystack **test** workspace first; verify the current dashboard labels in the account because navigation may change.

1. Select the test environment, not live mode. Create a dedicated staging app URL and isolated Firebase project first.
2. In Paystack API settings, copy the test public key only to `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`; store the test secret key only as server-side `PAYSTACK_SECRET_KEY`. Set `PAYSTACK_MODE=test` and `AGORA_ENVIRONMENT=staging`.
3. Add the exact staging webhook URL: `https://<staging-origin>/api/payments/paystack/webhook`. Confirm the `charge.success` event is delivered. The app checks `x-paystack-signature` as HMAC-SHA512 over the raw request body using the server secret and then verifies the transaction with Paystack.
4. Set the server callback origin to the exact HTTPS staging origin in `AGORA_APP_URL`. The callback path for buyer payments is `/checkout/complete`; seller subscription returns to `/dashboard/subscription`. Do not use a client-supplied host or callback URL.
5. Enable only payment channels the account is entitled to test and Agora has explicitly exercised. At minimum exercise Card separately from Ghana Mobile Money; verify the available MoMo networks and settlement options in the account. Do not infer MoMo readiness from a card test or enable untested channels as proof.
6. Confirm currency GHS, account transaction limits, business verification/KYB, settlement account, business contact details, and merchant notifications in Paystack settings. Keep test settlement isolated from live funds.
7. Verify Paystack transaction/email notifications and webhook delivery diagnostics are visible to the operations owner. Avoid sending payment credentials or full cardholder data into Agora logs.
8. Run the staging preflight, then the entire scenario checklist below. Save only non-sensitive references and outcomes in the approved staging test record.
9. For live launch, create/use live credentials in the production secret manager only, set `PAYSTACK_MODE=live`, `AGORA_ENVIRONMENT=production`, and confirm production Firebase IDs and HTTPS origin. Re-run the preflight adapted to production mode and perform a separately approved low-value live smoke transaction before taking customer traffic.

Never paste secret keys into source, `.env.example`, chat, screenshots, tickets, or client bundles. The public key is intentionally browser-visible; it is not a secret.

## Production-readiness matrix

`Local` reports repository evidence only. `Staging` and `Production ready` require external evidence and are not inferred from builds.

| Area | Local | Staging | Production ready |
|---|---|---|---|
| Checkout / server pricing | Unit tests and source-reviewed server re-query | Not run | No |
| Paystack initialization | Route/code exists; intent-before-provider ordering | Not run | No |
| Card payment | No real provider transaction | Not run | No |
| Ghana Mobile Money | No account/channel evidence | Not run | No |
| Webhook verification | HMAC helper tested; route not integration-tested | Not run | No |
| Payment verification | Server calls provider; mismatch helper tested | Not run | No |
| Amount validation | Local unit tests | Not run | No |
| Currency validation | GHS-only guard and unit tests | Not run | No |
| Idempotency | Stable reference and Firestore transaction logic reviewed; no finalizer integration/replay test | Not run | No |
| Order creation | Server-only finalizer code reviewed; emulator integration absent | Not run | No |
| Inventory | No reservation; success finalizer rechecks stock and decrements transactionally | Not run | No |
| Seller subscriptions | Authenticated server flow and rule tests; no provider integration | Not run | No |
| Refunds/reversals | Not implemented as an end-to-end workflow | Not run | No |
| Reconciliation | Design documented; no worker or alert | Not run | No |
| Firestore security | Emulator rule tests pass locally | Rules not deployed/verified | No |
| Authentication | Local session verification code; no staging auth acceptance test | Not run | No |
| Rate limiting | Route limits in code; no distributed/load verification | Not run | No |
| Dependency security | `npm audit --omit=dev`: 16 high, 64 moderate | Not run | No |
| Monitoring | Safe structured console events for key webhook/verify cases; no alert pipeline | Not configured/verified | No |
| Secrets | Key-mode guard and staging preflight added; deployment secret stores not inspected | Not configured/verified | No |
| Backup/recovery | No backup/restore evidence in repository | Not run | No |

## Remaining blockers and exact gate before TEST → LIVE

1. Provision a distinct staging Firebase project, HTTPS staging origin, server identity, and staging secret store. Configure the staging webhook and run the environment preflight.
2. Add an Admin-SDK/Firestore emulator integration harness for order/subscription finalization, payment ownership, duplicate events, inventory races, and terminal-state preservation.
3. Run and record the buyer card cases, delayed/replayed callbacks and webhooks, refresh/re-entry, failure/cancellation/pending paths, provider outage, and Ghana Mobile Money test with no sensitive credential data.
4. Close the distinct-attempt duplicate-charge risk with a checkout idempotency design and test concurrent/retried initialization.
5. Define delivery-fee collection and paid-price-change/out-of-stock support/refund operations. The current checkout charges item subtotal only and leaves delivery fee for seller confirmation.
6. Implement and test authorized refund/partial-refund/reversal state, ledger adjustments, seller impact, and operator audit; until then, freeze automated fulfillment on these cases.
7. Implement monitored reconciliation for stuck/contradictory payment and order states; deploy alerts for signature failures, mismatches, unknown references, stuck intents, and finalizer review cases.
8. Deploy Firestore rules/indexes/TTL to staging, prove staging IDs are isolated from production, and test authentication, rate limits, backup restore, and least-privilege service account access.
9. Resolve/accept documented dependency advisories through isolated upgrades and rerun tests/build/audit. No force fix.
10. Obtain payment-provider/business verification, validate allowed Ghana channels, verify settlement destination and notifications, complete a supervised end-to-end test plan, then review and approve each production secret in the production secret manager. Only then run an approved low-value live smoke test and explicitly authorize live traffic.

Agora AI remains separated from Paystack, payment initialization/verification, refunds, payouts, and financial records.
