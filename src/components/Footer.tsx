import Image from "next/image";
import Link from "next/link";

function ContactItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 flex h-9 w-9 shrink-0 rotate-45 items-center justify-center rounded-md bg-[var(--brand-sky)]">
        <span className="-rotate-45 text-white">{icon}</span>
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-dark)]">
          {label}
        </p>
        <div className="mt-1 text-[15px] leading-relaxed text-[var(--foreground)]/85">
          {children}
        </div>
      </div>
    </div>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function Footer() {
  return (
    <footer className="mt-24 bg-[var(--color-tint)]">
      <div className="brand-gradient h-[3px]" />
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 border-b border-[var(--color-accent)]/15">
        <ContactItem
          label="Call us"
          icon={
            <svg {...iconProps}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        >
          <a href="tel:+12123910312" className="hover:text-[var(--color-accent)]">
            (212) 391-0312
          </a>
        </ContactItem>
        <ContactItem
          label="Meet us"
          icon={
            <svg {...iconProps}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        >
          <a
            href="https://www.google.com/maps/search/?api=1&query=45W+45th+Street+New+York+NY+10036"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-accent)]"
          >
            45W 45th Street, 9th Floor,
            <br />
            New York, NY 10036
          </a>
        </ContactItem>
        <ContactItem
          label="Write to us"
          icon={
            <svg {...iconProps}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          }
        >
          <a href="mailto:info@jewelsourceinc.com" className="hover:text-[var(--color-accent)]">
            info@jewelsourceinc.com
          </a>
        </ContactItem>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2">
        <div>
          <Image
            src="/logo.png"
            alt="Jewel Source"
            width={1148}
            height={404}
            className="h-12 w-auto"
          />
          <p className="mt-4 text-sm text-[var(--foreground)]/65 leading-relaxed max-w-xs">
            Closeout jewelry, sourced and photographed for wholesale quote requests.
          </p>
        </div>
        <div className="sm:justify-self-end">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dark)] mb-3">
            Links
          </h3>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/" className="text-[var(--foreground)]/80 hover:text-[var(--color-accent)]">
              Catalog
            </Link>
            <Link href="/quote" className="text-[var(--foreground)]/80 hover:text-[var(--color-accent)]">
              Quote Request
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-[var(--color-accent)]/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-[var(--foreground)]/55">
          &copy; {new Date().getFullYear()} Jewel Source Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
