"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Spinner from "./Spinner";

export default function BackToCatalogLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.back())}
      disabled={isPending}
      className="inline-flex items-center gap-2 text-sm text-[var(--color-accent-dark)] hover:underline disabled:opacity-60"
    >
      {isPending ? <Spinner size={14} /> : null}
      {isPending ? "Loading..." : <>&larr; Back to catalog</>}
    </button>
  );
}
