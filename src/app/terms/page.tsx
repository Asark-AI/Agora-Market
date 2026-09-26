import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 text-[#17251d] sm:px-8">
      <article className="mx-auto max-w-2xl">
        <Link href="/sign-up" className="text-sm font-medium text-[#173b2b] hover:underline">Back to account creation</Link>
        <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#69776e]">Agora</p>
        <h1 className="mt-2 font-headline text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-3 text-sm text-[#657269]">The basic terms for using the Agora marketplace.</p>
        <div className="mt-10 space-y-7 text-sm leading-7 text-[#4f5d54]">
          <section><h2 className="font-semibold text-[#17251d]">Using Agora</h2><p className="mt-2">Agora provides a marketplace where customers can discover products and sellers can offer products for sale. You are responsible for the information you provide and for activity on your account.</p></section>
          <section><h2 className="font-semibold text-[#17251d]">Accounts and orders</h2><p className="mt-2">Keep your account details accurate and your password private. Orders, payments, delivery, returns, and seller obligations may be subject to additional marketplace policies shown at the time of purchase.</p></section>
          <section><h2 className="font-semibold text-[#17251d]">Contact</h2><p className="mt-2">For questions about these terms, contact Agora support through the marketplace.</p></section>
        </div>
      </article>
    </main>
  );
}
