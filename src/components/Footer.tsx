import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[var(--color-footer)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-serif text-xl tracking-wide">Jewel Source</p>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            Closeout jewelry, sourced and photographed for wholesale quote requests.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Links
          </h3>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/" className="text-white/85 hover:text-white">
              Catalog
            </Link>
            <Link href="/quote" className="text-white/85 hover:text-white">
              Quote Request
            </Link>
          </nav>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Contact
          </h3>
          <a href="mailto:info@jewelsource.inc" className="text-sm text-white/85 hover:text-white">
            info@jewelsource.inc
          </a>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-white/60">
          &copy; {new Date().getFullYear()} Jewel Source Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
