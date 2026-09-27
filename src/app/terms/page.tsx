import Link from 'next/link';

const sectionClass = 'space-y-3';
const headingClass = 'text-lg font-semibold text-[#17251d]';
const listClass = 'list-disc space-y-1 pl-6';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-8 text-[#17251d] sm:px-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/sign-up" className="text-sm font-medium text-[#173b2b] hover:underline">Back to account creation</Link>
        <header className="mt-10 border-b border-[#e2e9e2] pb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#69776e]">Agora</p>
          <h1 className="mt-2 font-headline text-3xl font-semibold sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-[#4f5d54]"><strong>Effective Date:</strong> [INSERT DATE]</p>
          <p className="mt-1 text-sm text-[#4f5d54]"><strong>Last Updated:</strong> [INSERT DATE]</p>
          <p className="mt-5 text-sm leading-6 text-[#657269]">Welcome to <strong>Agora</strong>.</p>
          <p className="mt-3 text-sm leading-6 text-[#657269]">These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Agora website, mobile applications, marketplace, seller services, delivery services, and related services (collectively, the &quot;Platform&quot;).</p>
          <div className="mt-5 space-y-1 text-sm leading-6 text-[#4f5d54]">
            <p>Agora is operated by:</p>
            <p><strong>Legal Business Name:</strong> [INSERT LEGAL COMPANY NAME]</p>
            <p><strong>Trading Name:</strong> Agora</p>
            <p><strong>Business Address:</strong> [INSERT BUSINESS ADDRESS]</p>
            <p><strong>Email:</strong> [INSERT SUPPORT EMAIL]</p>
            <p><strong>Phone:</strong> [INSERT PHONE NUMBER]</p>
            <p><strong>Country:</strong> Ghana</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#657269]">By accessing or using Agora, creating an account, placing an order, registering as a seller, registering as a rider/delivery partner, or otherwise using the Platform, you agree to these Terms.</p>
          <p className="mt-3 text-sm leading-6 text-[#657269]">If you do not agree to these Terms, you should not use the Platform.</p>
        </header>

        <div className="mt-8 space-y-9 text-sm leading-7 text-[#4f5d54]">
          <section className={sectionClass}>
            <h2 className={headingClass}>1. About Agora</h2>
            <p>Agora is a multi-vendor online marketplace that allows users to discover and purchase products offered by independent sellers.</p>
            <p>Depending on your role, Agora may allow you to:</p>
            <ul className={listClass}><li>Browse products without creating an account.</li><li>Create a buyer account.</li><li>Purchase products from sellers.</li><li>Save products to a wishlist.</li><li>Add products to a shopping cart.</li><li>Make payments through supported payment providers.</li><li>Track orders and deliveries.</li><li>Communicate with sellers or Agora support.</li><li>Register as a seller.</li><li>Create and manage product listings.</li><li>Receive and process customer orders.</li><li>Register as a delivery partner/rider where available.</li><li>Deliver orders.</li><li>Manage account and profile information.</li></ul>
            <p>Agora may introduce additional features and services from time to time.</p>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>2. Eligibility</h2><p>You must provide accurate information when creating an account or using features that require registration.</p><p>You are responsible for ensuring that you are legally permitted to use Agora under the laws applicable to you.</p><p>Where a feature or transaction is subject to an age requirement, legal restriction, or other eligibility requirement, you must satisfy that requirement before using the feature.</p><p>Agora may restrict access to particular services where required by law or where necessary to protect users and the Platform.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>3. Accounts</h2>
            <p>Some Agora features can be used without an account. An account may be required before completing certain transactions, including checkout.</p>
            <p>You are responsible for:</p>
            <ul className={listClass}><li>Providing accurate account information.</li><li>Keeping your login credentials confidential.</li><li>Protecting access to your device and account.</li><li>Promptly notifying Agora of suspected unauthorised access.</li><li>Ensuring that information associated with your account remains accurate.</li></ul>
            <p>You must not:</p>
            <ul className={listClass}><li>Create an account using another person&apos;s identity without permission.</li><li>Impersonate another person or business.</li><li>Create accounts for fraudulent purposes.</li><li>Share your account credentials with unauthorised persons.</li><li>Attempt to bypass Agora&apos;s security or access controls.</li></ul>
            <p>Agora may suspend or terminate an account where there is reasonable evidence of fraud, abuse, unlawful activity, security risks, or material violations of these Terms.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>4. Agora Marketplace</h2>
            <p>Agora provides the marketplace infrastructure through which buyers and sellers can interact.</p>
            <p>Unless expressly stated otherwise, products listed on Agora are offered by independent sellers.</p>
            <p>A seller is responsible for the products it lists, including their:</p>
            <ul className={listClass}><li>Description.</li><li>Images and videos.</li><li>Price.</li><li>Availability.</li><li>Condition.</li><li>Authenticity.</li><li>Specifications.</li><li>Warranties or guarantees.</li><li>Compliance with applicable laws.</li><li>Fulfilment obligations.</li></ul>
            <p>Agora may review, moderate, restrict, remove, or disable product listings that violate these Terms, applicable law, marketplace rules, or safety requirements.</p>
            <p>Agora does not guarantee that every seller, product, listing, review, or product description is accurate, available, authentic, or suitable for a particular purpose.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>5. Product Information and Pricing</h2>
            <p>Sellers are responsible for ensuring that their product information is accurate.</p>
            <p>Prices displayed on Agora may change before an order is placed.</p>
            <p>The total amount payable may include:</p>
            <ul className={listClass}><li>Product price.</li><li>Delivery charges.</li><li>Applicable taxes or statutory charges.</li><li>Service charges, where applicable.</li><li>Other charges disclosed during checkout.</li></ul>
            <p>The amount shown at checkout before payment is the amount you are asked to pay for the transaction, subject to any correction required because of an obvious pricing, technical, or system error.</p>
            <p>If a significant error affects an order, Agora may contact you to correct the order or cancel and refund the affected transaction.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>6. Orders</h2>
            <p>When you place an order, you are making a request to purchase the selected products.</p>
            <p>An order is not necessarily accepted until Agora and/or the relevant seller confirms the order.</p>
            <p>Orders may be rejected, cancelled, or modified where:</p>
            <ul className={listClass}><li>A product is unavailable.</li><li>A seller cannot fulfil the order.</li><li>Payment is unsuccessful.</li><li>Fraud or suspicious activity is detected.</li><li>The product listing contains a material error.</li><li>Delivery is unavailable to the requested location.</li><li>Required information is missing.</li><li>Cancellation is permitted under applicable law or marketplace rules.</li></ul>
            <p>Where an order is cancelled after payment has been received, eligible amounts will be refunded using the applicable refund process.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>7. Payments</h2>
            <p>Agora may use third-party payment providers to process payments.</p>
            <p>Supported payment methods may include mobile money, cards, bank payments, or other methods made available through the Platform.</p>
            <p>Agora does not normally receive or store complete payment-card credentials when payment processing is handled by a third-party payment provider.</p>
            <p>Payment providers may process payment information under their own terms and privacy policies.</p>
            <p>You agree to provide accurate payment information and to use only payment methods that you are authorised to use.</p>
            <p>Agora may delay, restrict, or cancel transactions where fraud, payment abuse, chargebacks, unauthorised transactions, or other suspicious activity is suspected.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>8. Seller Payments</h2>
            <p>Where Agora facilitates marketplace payments, funds may be received and processed through Agora and/or its designated payment providers before amounts owed to sellers are settled.</p>
            <p>Seller settlement timing may depend on:</p>
            <ul className={listClass}><li>Order status.</li><li>Delivery or fulfilment status.</li><li>Refunds.</li><li>Chargebacks.</li><li>Payment-provider rules.</li><li>Fraud and risk checks.</li><li>Marketplace policies.</li><li>Applicable law.</li></ul>
            <p>Agora may withhold or delay settlement where reasonably necessary to investigate fraud, disputes, returns, chargebacks, or violations of these Terms.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>9. Delivery</h2>
            <p>Agora may provide or facilitate delivery services through delivery partners, riders, logistics companies, or other service providers.</p>
            <p>Delivery availability, pricing, estimated delivery times, and delivery methods may vary depending on:</p>
            <ul className={listClass}><li>Pickup location.</li><li>Delivery destination.</li><li>Seller location.</li><li>Product type and size.</li><li>Rider availability.</li><li>Distance.</li><li>Weather.</li><li>Traffic.</li><li>Road conditions.</li><li>Operational circumstances.</li></ul>
            <p>Delivery estimates are estimates and are not guaranteed unless expressly stated otherwise.</p>
            <p>Customers must provide accurate delivery information and be reasonably available to receive orders.</p>
            <p>A delivery may be delayed or cancelled where circumstances outside Agora&apos;s reasonable control prevent successful delivery.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>10. Delivery Partners and Riders</h2>
            <p>Individuals or businesses providing delivery services through Agora must comply with applicable laws and Agora&apos;s delivery-partner requirements.</p>
            <p>Riders and delivery partners must:</p>
            <ul className={listClass}><li>Provide accurate information.</li><li>Maintain appropriate licences and permits where required.</li><li>Handle customer products responsibly.</li><li>Follow delivery instructions.</li><li>Protect customer information.</li><li>Not misuse customer addresses or contact information.</li><li>Not engage in fraudulent, abusive, threatening, or unlawful conduct.</li></ul>
            <p>Agora may suspend or remove a delivery partner for violations of these requirements.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>11. Returns, Refunds and Cancellations</h2>
            <p>Returns, refunds, replacements, and cancellations may depend on:</p>
            <ul className={listClass}><li>The product category.</li><li>Seller policies.</li><li>Product condition.</li><li>Reason for return.</li><li>Delivery status.</li><li>Applicable law.</li><li>Agora marketplace policies.</li></ul>
            <p>A seller must honour applicable return, refund, warranty, and consumer obligations.</p>
            <p>Agora may assist in resolving disputes between buyers and sellers.</p>
            <p>Nothing in these Terms removes rights that cannot lawfully be excluded under applicable law.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>12. Seller Responsibilities</h2>
            <p>Sellers must ensure that:</p>
            <ul className={listClass}><li>They have the legal right to sell listed products.</li><li>Product listings are truthful and accurate.</li><li>Products are genuine where authenticity is represented.</li><li>Products comply with applicable laws and regulations.</li><li>Prices and stock information are accurate.</li><li>Orders are fulfilled within applicable timeframes.</li><li>Customers receive products substantially matching the listing.</li><li>Required licences, approvals, certifications, or permits are obtained.</li><li>Products are packaged appropriately.</li><li>Customer information is used only for legitimate marketplace purposes.</li></ul>
            <p>Sellers must not use Agora to sell prohibited, counterfeit, stolen, fraudulent, unsafe, illegal, or otherwise restricted products.</p>
            <p>Agora may publish additional Seller Policies that form part of these Terms.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>13. Prohibited Activities</h2>
            <p>You must not use Agora to:</p>
            <ul className={listClass}><li>Commit fraud.</li><li>Scam or deceive another user.</li><li>Sell illegal or prohibited products.</li><li>Sell counterfeit products.</li><li>Use stolen payment credentials.</li><li>Manipulate ratings or reviews.</li><li>Create fake orders.</li><li>Abuse refunds or chargebacks.</li><li>Scrape or harvest user information without authorisation.</li><li>Introduce malware or malicious code.</li><li>Attempt to gain unauthorised access to Agora systems.</li><li>Circumvent security controls.</li><li>Interfere with Platform operations.</li><li>Impersonate another person or business.</li><li>Harass, threaten, or abuse another user.</li><li>Use Agora for unlawful purposes.</li></ul>
            <p>Agora may investigate suspected violations and take appropriate action.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>14. Reviews, Ratings and User Content</h2>
            <p>Agora may allow users to submit reviews, ratings, photographs, videos, comments, and other content.</p>
            <p>You are responsible for content you submit.</p>
            <p>You must not submit content that is:</p>
            <ul className={listClass}><li>False or misleading.</li><li>Fraudulent.</li><li>Defamatory or unlawful.</li><li>Threatening or abusive.</li><li>Infringing another person&apos;s intellectual-property rights.</li><li>Intended to manipulate ratings.</li><li>Unrelated to the relevant product or transaction.</li></ul>
            <p>By submitting content to Agora, you grant Agora a non-exclusive, worldwide, royalty-free licence to host, reproduce, display, distribute, modify where technically necessary, and use that content for operating, improving, promoting, and providing the Platform.</p>
            <p>You retain ownership of your content unless otherwise agreed.</p>
            <p>Agora may remove content that violates these Terms or applicable law.</p>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>15. Intellectual Property</h2><p>The Agora name, logo, software, website, application, designs, interfaces, graphics, text, trademarks, and other Platform materials are owned by or licensed to Agora unless otherwise stated.</p><p>You may not copy, reproduce, modify, distribute, sell, reverse engineer, or commercially exploit Agora&apos;s intellectual property without written permission.</p><p>Product photographs, descriptions, trademarks, and other seller-provided materials may belong to their respective owners.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>16. Communications</h2>
            <p>By creating an account or using Agora, you may receive service-related communications, including:</p>
            <ul className={listClass}><li>Account notifications.</li><li>Order confirmations.</li><li>Payment notifications.</li><li>Delivery updates.</li><li>Security alerts.</li><li>Customer-support communications.</li></ul>
            <p>Where legally permitted and subject to your preferences, Agora may also send promotional communications.</p>
            <p>You may opt out of promotional communications without affecting essential service communications.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>17. Privacy</h2>
            <p>Agora collects and processes personal information in accordance with its Privacy Policy.</p>
            <p>The Privacy Policy explains:</p>
            <ul className={listClass}><li>What information Agora collects.</li><li>Why information is collected.</li><li>How information is used.</li><li>How information is shared.</li><li>How long information may be retained.</li><li>Your privacy rights.</li><li>How to contact Agora about privacy matters.</li></ul>
            <p>The Privacy Policy forms part of these Terms. Read the <Link href="/privacy" className="font-medium text-[#173b2b] underline-offset-4 hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>18. Third-Party Services</h2><p>Agora may integrate with third-party services including payment providers, authentication providers, cloud infrastructure providers, analytics services, mapping services, messaging services, and logistics providers.</p><p>Third-party services may have separate terms and privacy policies.</p><p>Agora is not responsible for the independent operation, availability, or policies of third-party services.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>19. Availability of the Platform</h2>
            <p>Agora aims to maintain reliable services but does not guarantee that the Platform will always be:</p>
            <ul className={listClass}><li>Available.</li><li>Uninterrupted.</li><li>Error-free.</li><li>Secure against every possible threat.</li><li>Free from technical defects.</li></ul>
            <p>Maintenance, updates, network failures, cybersecurity incidents, third-party outages, and other circumstances may temporarily affect the Platform.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>20. Suspension and Termination</h2>
            <p>You may stop using Agora at any time.</p>
            <p>Agora may suspend or terminate access where reasonably necessary because of:</p>
            <ul className={listClass}><li>Fraud.</li><li>Abuse.</li><li>Security concerns.</li><li>Illegal activity.</li><li>Repeated policy violations.</li><li>Unpaid amounts.</li><li>Misuse of the Platform.</li><li>Breach of these Terms.</li></ul>
            <p>Termination does not automatically cancel obligations that arose before termination.</p>
            <p>Certain provisions, including intellectual-property, payment, liability, dispute, and other provisions intended to survive termination, will continue to apply.</p>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>21. Limitation of Liability</h2><p>To the maximum extent permitted by applicable law, Agora will not be liable for indirect, incidental, special, consequential, or unforeseeable losses arising from use of the Platform.</p><p>Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under applicable law.</p><p>Agora&apos;s responsibility may differ depending on whether an issue concerns Agora&apos;s own services, a seller&apos;s product, a payment provider, or a third-party delivery service.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>22. Indemnification</h2>
            <p>To the extent permitted by law, you agree to indemnify and hold Agora and its officers, employees, agents, contractors, and service providers harmless from claims, losses, liabilities, damages, and reasonable expenses arising from:</p>
            <ul className={listClass}><li>Your violation of these Terms.</li><li>Your unlawful use of the Platform.</li><li>Your fraud or misconduct.</li><li>Content you submit.</li><li>Your violation of another person&apos;s rights.</li><li>Your breach of applicable law.</li></ul>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>23. Changes to These Terms</h2><p>Agora may update these Terms from time to time.</p><p>When material changes are made, Agora may provide notice through the Platform, email, or another appropriate method.</p><p>The updated Terms will become effective on the date stated in the updated version.</p><p>Your continued use of Agora after the effective date constitutes acceptance of the updated Terms, to the extent permitted by law.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>24. Governing Law</h2><p>These Terms shall be governed by the laws of the Republic of Ghana, unless applicable law requires otherwise.</p><p>Disputes shall be handled through the courts or other lawful dispute-resolution mechanisms having appropriate jurisdiction in Ghana, subject to any mandatory consumer rights or alternative dispute-resolution requirements.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>25. Contact Us</h2>
            <p>For questions, complaints, or support concerning these Terms:</p>
            <div className="space-y-1"><p><strong>Agora</strong></p><p><strong>Legal Business Name:</strong> [INSERT]</p><p><strong>Address:</strong> [INSERT]</p><p><strong>Email:</strong> [INSERT LEGAL/SUPPORT EMAIL]</p><p><strong>Phone:</strong> [INSERT PHONE NUMBER]</p></div>
          </section>

          <p className="border-t border-[#e2e9e2] pt-6 text-sm"><strong>Last Updated:</strong> [INSERT DATE]</p>
        </div>
      </article>
    </main>
  );
}
