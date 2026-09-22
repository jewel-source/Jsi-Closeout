"use client";

import { useLinkStatus } from "next/link";
import Spinner from "./Spinner";

export default function LinkPendingSpinner({
  size = 12,
  className = "",
  variant = "accent",
}: {
  size?: number;
  className?: string;
  variant?: "accent" | "white";
}) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner size={size} className={className} variant={variant} /> : null;
}
