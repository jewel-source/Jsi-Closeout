import QuoteCartList from "@/components/QuoteCartList";
import QuoteForm from "@/components/QuoteForm";
export default function QuotePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Quote Request</h1>
      <p className="text-black/60 mt-2">
        Review the pieces you&apos;ve selected, then send us your details. Your
        request goes straight to our sales team at info@jewelsource.inc.
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Selected Items</h2>
        <QuoteCartList />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Your Details</h2>
        <QuoteForm />
      </div>
    </div>
  );
}
