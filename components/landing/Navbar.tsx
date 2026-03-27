"use client";

import Image from "next/image";
import { NAV } from "@/lib/copy";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface-variant/60 backdrop-blur-xl transition-all duration-300">
      <div className="flex justify-between items-center px-6 md:px-8 h-20 w-full max-w-7xl mx-auto">
        <Image src="/logo.svg" alt="NexIA" width={120} height={32} className="h-8 md:h-10 w-auto" />

        <div className="hidden md:flex items-center gap-8">
          {NAV.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-muted font-medium hover:text-primary transition-colors duration-300 text-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-text-muted font-medium hover:text-text-white transition-colors px-4 py-2 text-sm">
            {NAV.login}
          </button>
          <button className="cta-yellow font-bold px-6 py-2.5 rounded-lg text-sm shadow-xl shadow-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {NAV.cta}
          </button>
        </div>
      </div>
    </nav>
  );
}
