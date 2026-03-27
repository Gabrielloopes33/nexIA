import Image from "next/image";
import { FOOTER } from "@/lib/copy";

export function Footer() {
  return (
    <footer className="bg-page-bg pt-16 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12 mb-8">
          <div className="text-center md:text-left">
            <Image src="/logo.svg" alt="NexIA" width={120} height={32} className="h-8 md:h-10 w-auto mb-4" />
            <p className="text-text-body max-w-sm">{FOOTER.description}</p>
          </div>

          <div className="flex gap-8">
            {FOOTER.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-text-muted hover:text-text-white transition-colors text-sm"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-text-muted">{FOOTER.copyright}</p>
      </div>
    </footer>
  );
}
