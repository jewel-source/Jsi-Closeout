import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 bg-[var(--color-tint)]">
      <div className="brand-gradient h-[3px]" />
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 sm:grid-cols-3">
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
        <div>
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
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dark)] mb-3">
            Contact
          </h3>
          <a
            href="mailto:info@jewelsource.inc"
            className="text-sm text-[var(--foreground)]/80 hover:text-[var(--color-accent)]"
          >
            info@jewelsource.inc
          </a>
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
