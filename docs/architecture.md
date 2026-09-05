# Agora Platform Architecture

## Current application

Agora is currently a single Next.js 14 App Router application backed by Firebase Authentication, Cloud Firestore, Firebase Storage, and Firebase Admin SDK. Buyer, seller, and Super Admin experiences share one web application. Capacitor currently packages one marketplace Android application.

The existing seller model is stored under `sellers/{sellerId}` with nested products, orders, customers, messages, and payout methods. Existing checkout writes seller-scoped orders from the client after a Flutterwave callback. That flow remains in place during migration.

## Identity and capabilities

Firebase `uid` is the canonical identity across all Agora applications. Capabilities belong to the identity, but client-provided capability values are never authorization. Server operations must verify the Firebase token, capability status, resource ownership, and current resource state.

The shared type layer now includes:

- `UserCapabilities` for buyer, seller, rider, and admin capabilities.
- `CapabilityStatus` for approval and suspension workflows.
- `RiderProfile` with `AGORA` and `STORE` rider types.
- Expanded seller lifecycle statuses.

Specialized profile records should use these paths:

```text
users/{uid}
sellerProfiles/{uid}
riderProfiles/{uid}
```

Existing `sellers/{sellerId}` records remain supported until seller data is migrated safely.

## Canonical commerce and delivery model

The target model separates commercial and logistics concerns:

```text
Order -> Shipment -> Delivery -> RiderAssignment
```

Proposed top-level collections:

```text
orders/{orderId}
shipments/{shipmentId}
deliveries/{deliveryId}
deliveries/{deliveryId}/events/{eventId}
deliveries/{deliveryId}/attempts/{attemptId}
deliveries/{deliveryId}/assignments/{assignmentId}
deliveryZones/{zoneId}
deliveryPricing/{pricingVersionId}
deliveryProviders/{providerId}
riderEarnings/{earningId}
notifications/{notificationId}
auditLogs/{logId}
```

An order may contain multiple shipments. A shipment normally groups items from one seller or fulfillment source. A delivery is the transport operation and has one provider: `AGORA`, `STORE`, `PARTNER`, or `PICKUP`.

The shared delivery state machine is implemented in `src/lib/delivery/state-machine.ts`. It is pure and side-effect free so server actions, API routes, tests, seller views, rider views, and admin tools can all use the same transition rules.

## Security boundary

Sensitive operations must move behind server actions or API routes before Firestore rules are tightened:

- Confirming paid orders.
- Calculating and charging delivery fees.
- Creating shipments and deliveries.
- Assigning or accepting riders.
- Pickup, arrival, failure, cancellation, and completion transitions.
- OTP verification and proof-of-delivery storage.
- Rider earnings and seller settlement records.

The initial server-only guards live in `src/lib/server/authorization.ts`. They resolve seller ownership and approved rider status through the Admin SDK. They are intentionally not wired into legacy client writes yet; each sensitive flow should migrate to these guards before its Firestore permissions are narrowed.

Every command must validate authentication, capability approval, resource ownership, current state, and an idempotency key where duplicate requests could create financial or operational side effects.

## Migration phases

1. Add shared capabilities, profiles, delivery types, and the pure state machine.
2. Add server authorization helpers and rider/seller profile persistence.
3. Add server-side order confirmation and delivery quote endpoints while preserving legacy reads.
4. Create shipments and deliveries for new orders through the Delivery Engine.
5. Tighten Firestore rules after sensitive writes no longer come directly from clients.
6. Add Seller Delivery Center and store rider invitations.
7. Add Rider onboarding, availability, delivery requests, pickup, navigation, OTP, and earnings.
8. Add buyer delivery selection and order tracking.
9. Add Admin logistics views with server-side pagination.
10. Add real-time delivery events, notifications, maps, deep links, and separate Capacitor app profiles.

Each phase must run TypeScript, lint, production build, and focused security/regression tests before the next phase begins.

## Capacitor strategy

Keep shared web source and select the native identity at build time:

```text
marketplace: com.agora.market
seller:      com.agora.seller
rider:       com.agora.rider
```

The profiles should control app name, icon, splash, permissions, deep links, and push configuration. GPS/background location permissions belong only to the rider profile.
