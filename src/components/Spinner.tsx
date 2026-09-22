export default function Spinner({
  className = "",
  size = 32,
  variant = "accent",
}: {
  className?: string;
  size?: number;
  variant?: "accent" | "white";
}) {
  const colorClasses =
    variant === "white"
      ? "border-white/30 border-t-white"
      : "border-[var(--color-accent)]/20 border-t-[var(--color-accent)]";

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        style={{ width: size, height: size }}
        className={`rounded-full border-2 animate-spin ${colorClasses}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
