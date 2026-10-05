import { AlertCircle } from 'lucide-react';

export function LiveDataUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <section role="status" className="mx-auto flex w-full max-w-2xl gap-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700" />
      <div>
        <h1 className="font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-amber-900">{description}</p>
        <p className="mt-2 text-xs text-amber-800">No sample or demonstration records are shown in this section.</p>
      </div>
    </section>
  );
}
