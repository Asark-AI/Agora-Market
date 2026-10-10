# Agora Search Modes

The buyer search page provides Normal Search, AI Search, and Visual Search at `/search`.

## AI Search

AI Search uses the existing server-side grounded shopping planner. Product facts and cart selections come from active Agora inventory; the model does not create product listings or set prices. Selected products are refreshed against current price and stock before they are added to the existing cart.

## Visual Search

Visual Search accepts JPEG, PNG, and WebP images up to 4 MB and 25 megapixels. The server checks file signatures and basic structure, applies per-actor request limits, analyzes the image with Gemini 2.5 Flash, and turns visible product attributes into a query for active Agora inventory. Returned matches are real catalog listings, not generated products. Prices and stock are refreshed before adding items to the cart.

Images are held in memory for the request and are not uploaded to Agora storage. The image is sent to Google AI for analysis. Configure `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `GOOGLE_GENAI_API_KEY` as a server-side environment variable. If no supported provider credential is configured, Visual Search responds with an explicit configuration error.

Visual similarity is approximate. Product identity, authenticity, specifications, compatibility, delivery, or availability are not guaranteed by image recognition; buyers should check the listing details. The provider may apply its own data handling and usage terms, and visual model calls may incur provider charges.

## Goal-based solutions

Super Admin-managed solution templates supply reusable requirements; public buyers can use the template builder to replace/remove recommendations, mark products as already owned, adjust quantities within template and stock limits, and add a partial or full selection to the existing cart. The subtotal uses current listed discounted prices when available and excludes delivery. Catalog recommendations are restricted to active listings with positive stock.

Compatibility is deterministic and conservative for fields implemented in `src/lib/solutions.ts` (CPU/motherboard sockets, RAM/motherboard DDR generation, GPU/case clearance, and GPU recommended power supply). It reports unknown if the structured listing data needed for a comparison is absent. Seller-provided specs are not independently verified; buyers should review them. Other requirement types remain unknown rather than receiving a generic compatibility claim.

Solution template writes and deletes remain Super Admin-only and produce admin audit entries. Search-mode AI suggestions are derived from the available solution templates and do not expose product catalog text to the model. Only the Gaming PC default template is included; broader templates require Super Admin configuration.

Run `npm run test:visual-search` and `npm run test:solutions-engine` for focused upload and solution-rule tests.
