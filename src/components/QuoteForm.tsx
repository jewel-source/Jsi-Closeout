"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuoteCart } from "@/context/QuoteCartContext";
import Spinner from "./Spinner";
type Status = "idle" | "submitting" | "success" | "error";
export default function QuoteForm() {
  const { items, clear } = useQuoteCart();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return; // guard against a double-fire before the disabled state re-renders
    setStatus("submitting");
    setError(null);
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setStatus("error");
      setError(
        "Quote form isn't configured yet — set NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY in .env.",
      );
      return;
    }
    const formData = new FormData(e.currentTarget);
    const itemsList = items
      .map((i) => `${i.styleNumber} — ${i.name} (qty ${i.quantity})`)
      .join("\n");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `New quote request from ${formData.get("name")}`,
          from_name: "Jewel Source Website",
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          message: formData.get("message"),
          requested_items: itemsList,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        clear();
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }
  if (status === "success") {
    return (
      <div className="rounded-2xl bg-[var(--color-tint)] border border-[var(--color-accent)]/20 p-8 text-center">
        <h2 className="text-lg font-semibold">Quote request sent</h2>
        <p className="text-[var(--foreground)]/60 mt-2">
          Thanks — we&apos;ll be in touch shortly at the email you provided.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)]"
        >
          Continue browsing
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full border border-[var(--color-accent)]/25 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-[var(--color-accent)]/25 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            className="w-full border border-[var(--color-accent)]/25 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="company">
            Company
          </label>
          <input
            id="company"
            name="company"
            className="w-full border border-[var(--color-accent)]/25 rounded-md px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="message">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full border border-[var(--color-accent)]/25 rounded-md px-3 py-2"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || items.length === 0}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-dark)] disabled:opacity-50"
      >
        {status === "submitting" && <Spinner size={16} variant="white" />}
        {status === "submitting" ? "Sending..." : "Send quote request"}
      </button>
    </form>
  );
}
