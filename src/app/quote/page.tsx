import QuoteCartList from "@/components/QuoteCartList";
import QuoteForm from "@/components/QuoteForm";

export default function QuotePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-footer)]">
        Quote Request
      </h1>
      <p className="text-[var(--foreground)]/70 mt-2">
        Review the pieces you&apos;ve selected, then send us your details. Your request goes
        straight to our sales team at info@jewelsource.inc.
      </p>

      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dark)] mb-3">
          Selected Items
        </h2>
        <QuoteCartList />
      </div>

      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dark)] mb-3">
          Your Details
        </h2>
        <QuoteForm />
      </div>
    </div>
  );
}
