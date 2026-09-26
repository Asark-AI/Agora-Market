import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 text-[#17251d] sm:px-8">
      <article className="mx-auto max-w-2xl">
        <Link href="/sign-up" className="text-sm font-medium text-[#173b2b] hover:underline">Back to account creation</Link>
        <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#69776e]">Agora</p>
        <h1 className="mt-2 font-headline text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#657269]">How Agora handles information used to provide the marketplace.</p>
        <div className="mt-10 space-y-7 text-sm leading-7 text-[#4f5d54]">
          <section><h2 className="font-semibold text-[#17251d]">Information we use</h2><p className="mt-2">We use account, order, delivery, and seller information to operate Agora, keep accounts secure, process marketplace activity, and provide support.</p></section>
          <section><h2 className="font-semibold text-[#17251d]">Your choices</h2><p className="mt-2">You can review and update much of your account information from your profile. Contact Agora support with questions about access, correction, or deletion requests.</p></section>
          <section><h2 className="font-semibold text-[#17251d]">Security</h2><p className="mt-2">Agora uses reasonable technical and operational safeguards to protect account and marketplace information.</p></section>
        </div>
      </article>
    </main>
  );
}
