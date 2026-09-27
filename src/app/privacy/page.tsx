import Link from 'next/link';

const sectionClass = 'space-y-3';
const headingClass = 'text-lg font-semibold text-[#17251d]';
const listClass = 'list-disc space-y-1 pl-6';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-8 text-[#17251d] sm:px-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/sign-up" className="text-sm font-medium text-[#173b2b] hover:underline">Back to account creation</Link>
        <header className="mt-10 border-b border-[#e2e9e2] pb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#69776e]">Agora</p>
          <h1 className="mt-2 font-headline text-3xl font-semibold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-[#4f5d54]"><strong>Effective Date:</strong> [INSERT DATE]</p>
          <p className="mt-1 text-sm text-[#4f5d54]"><strong>Last Updated:</strong> [INSERT DATE]</p>
          <p className="mt-5 text-sm leading-6 text-[#657269]">This Privacy Policy explains how <strong>Agora</strong> ("Agora", "we", "us", or "our") collects, uses, stores, protects, and shares personal information when you use our website, mobile applications, marketplace, seller services, delivery services, and related services (collectively, the "Platform").</p>
          <div className="mt-5 space-y-1 text-sm leading-6 text-[#4f5d54]">
            <p>Agora is operated by:</p>
            <p><strong>Legal Business Name:</strong> [INSERT LEGAL COMPANY NAME]</p>
            <p><strong>Trading Name:</strong> Agora</p>
            <p><strong>Address:</strong> [INSERT BUSINESS ADDRESS]</p>
            <p><strong>Email:</strong> [INSERT PRIVACY EMAIL]</p>
            <p><strong>Phone:</strong> [INSERT PHONE NUMBER]</p>
            <p><strong>Country:</strong> Ghana</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#657269]">This Privacy Policy should be read together with our Terms of Service.</p>
        </header>

        <div className="mt-8 space-y-9 text-sm leading-7 text-[#4f5d54]">
          <section className={sectionClass}>
            <h2 className={headingClass}>1. Our Commitment to Privacy</h2>
            <p>Agora respects your privacy and is committed to handling personal information responsibly.</p>
            <p>We process personal information in accordance with applicable data-protection laws, including Ghana&apos;s Data Protection Act, 2012 (Act 843), where applicable.</p>
            <p>We collect information only for legitimate and specified purposes and take reasonable measures to protect information against unauthorised access, loss, misuse, alteration, or disclosure.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>2. Information We Collect</h2>
            <p>Depending on how you use Agora, we may collect different categories of information.</p>
            <h3 className="font-semibold text-[#17251d]">2.1 Account Information</h3>
            <p>When you create an account, we may collect:</p>
            <ul className={listClass}>
              <li>Full name.</li><li>Email address.</li><li>Telephone number.</li><li>Password or authentication information.</li><li>Profile photograph, if provided.</li><li>Account type or role.</li><li>Account preferences.</li><li>Verification information.</li>
            </ul>
            <p>We do not intend to store your plain-text password.</p>

            <h3 className="font-semibold text-[#17251d]">2.2 Buyer Information</h3>
            <p>When you use Agora as a buyer, we may collect:</p>
            <ul className={listClass}>
              <li>Delivery name.</li><li>Delivery telephone number.</li><li>Delivery address.</li><li>Delivery instructions.</li><li>Order history.</li><li>Products purchased.</li><li>Wishlist information.</li><li>Cart information.</li><li>Reviews and ratings.</li><li>Customer-support communications.</li><li>Refund and return information.</li>
            </ul>

            <h3 className="font-semibold text-[#17251d]">2.3 Seller Information</h3>
            <p>If you register as a seller, we may collect additional information such as:</p>
            <ul className={listClass}>
              <li>Individual or business name.</li><li>Business contact information.</li><li>Seller profile information.</li><li>Business address.</li><li>Identification or verification information where required.</li><li>Tax or business information where legally required.</li><li>Product information.</li><li>Order information.</li><li>Settlement information.</li><li>Seller communications.</li><li>Seller performance information.</li>
            </ul>
            <p>Additional verification may be required before seller services are activated.</p>

            <h3 className="font-semibold text-[#17251d]">2.4 Rider and Delivery-Partner Information</h3>
            <p>If you register as a rider or delivery partner, we may collect information necessary to operate delivery services, which may include:</p>
            <ul className={listClass}>
              <li>Name.</li><li>Telephone number.</li><li>Profile photograph.</li><li>Vehicle information.</li><li>Driver or rider licence information where required.</li><li>Identification information.</li><li>Delivery activity.</li><li>Delivery status.</li><li>Location information where required for delivery operations.</li><li>Payment or settlement information.</li>
            </ul>

            <h3 className="font-semibold text-[#17251d]">2.5 Payment Information</h3>
            <p>When you make a payment, Agora may receive information relating to the transaction, including:</p>
            <ul className={listClass}>
              <li>Payment status.</li><li>Transaction reference.</li><li>Amount paid.</li><li>Currency.</li><li>Payment method.</li><li>Order associated with the transaction.</li><li>Refund or chargeback information.</li>
            </ul>
            <p>Payments may be processed by third-party payment providers.</p>
            <p>Where payment processing is performed by a payment provider, that provider may separately process payment information under its own privacy policy and terms.</p>
            <p>Agora does not intentionally store complete payment-card numbers when those details are handled directly by a payment provider.</p>

            <h3 className="font-semibold text-[#17251d]">2.6 Location Information</h3>
            <p>Depending on the features you use, Agora may process location information.</p>
            <p>For example, location information may be used to:</p>
            <ul className={listClass}>
              <li>Determine delivery availability.</li><li>Provide delivery services.</li><li>Help riders locate pickup and delivery points.</li><li>Display relevant marketplace services.</li><li>Improve delivery tracking.</li><li>Prevent fraud or misuse.</li><li>Improve operational efficiency.</li>
            </ul>
            <p>Where possible, you may control location permissions through your device settings.</p>
            <p>Some delivery features may not function correctly without appropriate location permissions.</p>

            <h3 className="font-semibold text-[#17251d]">2.7 Device and Technical Information</h3>
            <p>When you use Agora, we may automatically collect technical information such as:</p>
            <ul className={listClass}>
              <li>IP address.</li><li>Device type.</li><li>Operating system.</li><li>Browser type.</li><li>App version.</li><li>Device identifiers.</li><li>Network information.</li><li>Language preferences.</li><li>Time zone.</li><li>Crash information.</li><li>Performance information.</li><li>Security and authentication logs.</li>
            </ul>
            <p>This information helps us operate, secure, troubleshoot, and improve Agora.</p>

            <h3 className="font-semibold text-[#17251d]">2.8 Communications</h3>
            <p>If you contact Agora, we may retain information contained in:</p>
            <ul className={listClass}>
              <li>Emails.</li><li>Support tickets.</li><li>Chat messages.</li><li>Customer-service communications.</li><li>Seller communications.</li><li>Delivery-related communications.</li><li>Other correspondence.</li>
            </ul>
            <p>We may use these communications to provide support, investigate complaints, resolve disputes, and improve our services.</p>

            <h3 className="font-semibold text-[#17251d]">2.9 User-Generated Content</h3>
            <p>We may collect information you voluntarily provide, including:</p>
            <ul className={listClass}>
              <li>Product reviews.</li><li>Ratings.</li><li>Comments.</li><li>Product photographs.</li><li>Videos.</li><li>Profile photographs.</li><li>Seller content.</li><li>Other marketplace content.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>3. How We Use Personal Information</h2>
            <h3 className="font-semibold text-[#17251d]">Provide Agora services</h3>
            <ul className={listClass}><li>Create and manage accounts.</li><li>Process orders.</li><li>Process payments.</li><li>Coordinate deliveries.</li><li>Provide customer support.</li><li>Connect buyers and sellers.</li><li>Operate seller services.</li><li>Operate delivery services.</li></ul>
            <h3 className="font-semibold text-[#17251d]">Improve Agora</h3>
            <ul className={listClass}><li>Understand how users interact with the Platform.</li><li>Improve product discovery.</li><li>Improve search and recommendations.</li><li>Improve performance.</li><li>Diagnose technical problems.</li><li>Develop new features.</li></ul>
            <h3 className="font-semibold text-[#17251d]">Security and fraud prevention</h3>
            <p>We may use information to:</p>
            <ul className={listClass}><li>Detect suspicious transactions.</li><li>Prevent fraud.</li><li>Protect accounts.</li><li>Investigate abuse.</li><li>Protect Agora and its users.</li><li>Detect cybersecurity threats.</li><li>Enforce our Terms.</li></ul>
            <h3 className="font-semibold text-[#17251d]">Legal and regulatory purposes</h3>
            <p>We may process information to:</p>
            <ul className={listClass}><li>Comply with applicable laws.</li><li>Respond to lawful requests.</li><li>Resolve disputes.</li><li>Establish or defend legal claims.</li><li>Maintain appropriate business records.</li></ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>4. Lawful Basis for Processing</h2>
            <p>Depending on the circumstances and applicable law, Agora may process personal information because:</p>
            <ul className={listClass}><li>Processing is necessary to provide a service you requested.</li><li>Processing is necessary to perform a contract.</li><li>Processing is required by law.</li><li>Processing is necessary for legitimate business purposes, provided those interests do not override applicable privacy rights.</li><li>You have provided consent where consent is required.</li><li>Processing is necessary to protect important interests or prevent fraud or abuse where permitted by law.</li></ul>
            <p>Where consent is the appropriate legal basis, you may withdraw consent subject to applicable legal and operational limitations.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>5. How We Share Information</h2>
            <p>Agora may share personal information with selected parties where reasonably necessary to operate the Platform.</p>
            <h3 className="font-semibold text-[#17251d]">Sellers</h3><p>For example, sellers may receive information necessary to fulfil an order, such as relevant customer name, delivery information, contact information, and order details.</p><p>Sellers must use customer information only for legitimate marketplace purposes and must comply with applicable privacy obligations.</p>
            <h3 className="font-semibold text-[#17251d]">Delivery Partners</h3><p>Riders and logistics providers may receive information necessary to collect and deliver an order, including relevant delivery address, recipient information, contact information, and order information.</p>
            <h3 className="font-semibold text-[#17251d]">Payment Providers</h3><p>We may share transaction information with payment providers to process payments, refunds, settlements, fraud checks, and related transactions.</p>
            <h3 className="font-semibold text-[#17251d]">Technology and Infrastructure Providers</h3><p>Agora may use third-party providers for services such as:</p><ul className={listClass}><li>Cloud hosting.</li><li>Authentication.</li><li>Database infrastructure.</li><li>File and image storage.</li><li>Application monitoring.</li><li>Security.</li><li>Analytics.</li><li>Messaging.</li><li>Email delivery.</li><li>Push notifications.</li></ul><p>Examples may include infrastructure providers such as Firebase/Google Cloud where used by Agora.</p>
            <h3 className="font-semibold text-[#17251d]">Legal and Regulatory Authorities</h3><p>We may disclose information where required or permitted by law, including to:</p><ul className={listClass}><li>Courts.</li><li>Government authorities.</li><li>Law-enforcement agencies.</li><li>Regulators.</li><li>Legal advisers.</li></ul><p>We may also disclose information where necessary to protect the rights, safety, property, or security of Agora, our users, or others.</p>
          </section>

          <section className={sectionClass}><h2 className={headingClass}>6. Seller Access to Customer Information</h2><p>Because Agora is a marketplace, sellers may need limited customer information to fulfil orders.</p><p>A seller&apos;s access should be limited to information reasonably necessary for the relevant transaction.</p><p>Sellers must not:</p><ul className={listClass}><li>Sell customer information.</li><li>Use customer information for unrelated marketing without appropriate legal permission.</li><li>Export customer information for unauthorised purposes.</li><li>Contact customers for unrelated purposes.</li><li>Share customer information with unauthorised persons.</li></ul><p>Agora may restrict or terminate seller access where misuse is suspected.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>7. Delivery Location and Tracking</h2><p>Where delivery tracking is available, Agora may process location information from a rider&apos;s device.</p><p>This may be used to:</p><ul className={listClass}><li>Determine delivery progress.</li><li>Display delivery status.</li><li>Improve route coordination.</li><li>Provide estimated arrival information.</li><li>Investigate delivery disputes.</li><li>Protect against fraud or misuse.</li></ul><p>Location tracking should be limited to what is reasonably necessary for the delivery service.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>8. Cookies and Similar Technologies</h2><p>Agora may use cookies, local storage, SDKs, pixels, and similar technologies.</p><p>These technologies may be used for:</p><ul className={listClass}><li>Authentication.</li><li>Security.</li><li>Remembering preferences.</li><li>Shopping-cart functionality.</li><li>Performance monitoring.</li><li>Analytics.</li><li>Improving the Platform.</li></ul><p>You may be able to control some cookies through your browser or device settings.</p><p>Disabling certain technologies may affect functionality.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>9. Analytics</h2><p>Agora may use analytics and monitoring technologies to understand Platform usage and improve reliability.</p><p>Analytics information may include technical information, usage events, device information, performance information, and other information configured within the relevant analytics service.</p><p>Where third-party analytics services are used, those providers may process information according to their own privacy policies.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>10. Marketing Communications</h2><p>We may send promotional communications where permitted by applicable law.</p><p>These may include:</p><ul className={listClass}><li>New-product announcements.</li><li>Promotions.</li><li>Discounts.</li><li>Marketplace updates.</li><li>Seller or platform announcements.</li></ul><p>You may unsubscribe from promotional emails or other marketing communications using the available unsubscribe or preference controls.</p><p>You will continue to receive important service communications, such as security, payment, order, and delivery notifications.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>11. Data Retention</h2><p>Agora retains personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, unless a longer period is required or permitted by law.</p><p>Retention periods may depend on:</p><ul className={listClass}><li>The type of information.</li><li>The purpose for which it was collected.</li><li>Whether an account remains active.</li><li>Legal and regulatory obligations.</li><li>Accounting requirements.</li><li>Fraud prevention.</li><li>Dispute resolution.</li><li>Security requirements.</li></ul><p>When information is no longer required, Agora may securely delete, anonymise, or otherwise dispose of it.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>12. Data Security</h2><p>Agora uses reasonable technical and organisational measures designed to protect personal information.</p><p>These measures may include:</p><ul className={listClass}><li>Encryption where appropriate.</li><li>Access controls.</li><li>Authentication controls.</li><li>Security monitoring.</li><li>Secure infrastructure.</li><li>Logging and auditing.</li><li>Data minimisation.</li><li>Employee or contractor access restrictions.</li></ul><p>However, no internet-connected service can guarantee absolute security.</p><p>You are responsible for keeping your account credentials secure and should notify Agora promptly if you suspect unauthorised access.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>13. Data Breaches and Security Incidents</h2><p>If Agora becomes aware of a personal-data breach, we will assess and respond to the incident in accordance with applicable law and our security procedures.</p><p>Where notification is legally required, we will notify the relevant authorities and/or affected individuals as required.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>14. International Data Transfers</h2><p>Some technology providers used by Agora may process information outside Ghana.</p><p>Where personal information is transferred or processed internationally, Agora will take reasonable steps to ensure that the processing is carried out in accordance with applicable legal requirements and appropriate safeguards.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>15. Your Privacy Rights</h2><p>Subject to applicable law and any lawful limitations, you may have rights relating to your personal information, including rights to:</p><ul className={listClass}><li>Request access to personal information we hold about you.</li><li>Request correction of inaccurate information.</li><li>Request deletion where legally applicable.</li><li>Object to certain processing.</li><li>Request restriction of certain processing.</li><li>Withdraw consent where processing relies on consent.</li><li>Request information about how your data is used.</li><li>Raise a complaint concerning our processing of your personal information.</li></ul><p>To exercise a privacy right, contact:</p><p><strong>Privacy Email:</strong> [INSERT PRIVACY EMAIL]</p><p>We may need to verify your identity before processing certain requests.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>16. Account Deletion</h2><p>You may request deletion of your Agora account.</p><p>Deleting an account may not immediately delete every record associated with you where Agora is legally required or permitted to retain certain information, such as:</p><ul className={listClass}><li>Transaction records.</li><li>Accounting records.</li><li>Fraud-prevention records.</li><li>Legal records.</li><li>Dispute records.</li><li>Security logs.</li></ul><p>Where retention is no longer required, applicable information will be deleted or anonymised according to our retention practices.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>17. Children&apos;s Privacy</h2><p>Agora is not intended to be used by children where use would violate applicable age restrictions or legal requirements.</p><p>We do not knowingly collect personal information from children in circumstances where such collection is prohibited by law.</p><p>If you believe a child has provided personal information to Agora improperly, contact us at:</p><p><strong>[INSERT PRIVACY EMAIL]</strong></p><p>We will assess the request and take appropriate action where required.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>18. Third-Party Websites and Services</h2><p>Agora may contain links to third-party websites or services.</p><p>We are not responsible for the privacy practices of independent third parties.</p><p>You should review the privacy policy of a third-party service before providing information to it.</p></section>

          <section className={sectionClass}><h2 className={headingClass}>19. Changes to This Privacy Policy</h2><p>We may update this Privacy Policy from time to time.</p><p>If material changes are made, we may notify users through the Platform, email, or another appropriate method.</p><p>The updated policy will display a new "Last Updated" date.</p></section>

          <section className={sectionClass}>
            <h2 className={headingClass}>20. Contact and Privacy Complaints</h2>
            <p>For privacy questions, requests, or complaints, contact:</p>
            <div className="space-y-1">
              <p><strong>Agora</strong></p>
              <p><strong>Legal Business Name:</strong> [INSERT LEGAL COMPANY NAME]</p>
              <p><strong>Privacy Contact:</strong> [INSERT NAME OR PRIVACY TEAM]</p>
              <p><strong>Email:</strong> [INSERT PRIVACY EMAIL]</p>
              <p><strong>Phone:</strong> [INSERT PHONE NUMBER]</p>
              <p><strong>Address:</strong> [INSERT BUSINESS ADDRESS]</p>
            </div>
            <p>If you are not satisfied with how a privacy matter has been handled, you may also have the right to contact the relevant data-protection regulator in Ghana.</p>
          </section>

          <p className="border-t border-[#e2e9e2] pt-6 text-sm"><strong>Last Updated:</strong> [INSERT DATE]</p>
        </div>
      </article>
    </main>
  );
}
