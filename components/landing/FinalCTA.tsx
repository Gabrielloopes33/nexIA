"use client";

import { motion } from "framer-motion";
import { FINAL_CTA } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-section-bg">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger(0.12)}
          >
            <motion.h2
              variants={fadeUp}
              className="font-headline font-extrabold text-4xl sm:text-5xl md:text-6xl headline-tight mb-6"
            >
              {FINAL_CTA.title}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-yellow font-headline font-bold text-xl md:text-2xl leading-snug mb-8"
            >
              {FINAL_CTA.subtitle}
            </motion.p>

            <div className="space-y-5 mb-10">
              {FINAL_CTA.body.map((paragraph, i) => (
                <motion.p
                  key={i}
                  variants={fadeUp}
                  className="text-text-body text-lg leading-relaxed"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.div variants={fadeUp}>
              <a
                href="#precos"
                className="cta-yellow font-extrabold px-10 py-5 rounded-2xl text-xl shadow-[0_0_50px_rgba(243,200,69,0.3)] hover:scale-105 active:scale-95 transition-all inline-block"
              >
                {FINAL_CTA.cta}
              </a>
              <p className="mt-6 text-text-muted font-medium flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-yellow"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                {FINAL_CTA.proof}
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="glass-card rounded-2xl p-6 shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <div className="ml-4 h-5 w-32 bg-white/5 rounded" />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <div className="text-2xl font-extrabold font-headline text-primary">247</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Leads hoje</div>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="text-2xl font-extrabold font-headline text-emerald-400">98%</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Atendidos</div>
                </div>
                <div className="bg-yellow/10 rounded-xl p-4 border border-yellow/20">
                  <div className="text-2xl font-extrabold font-headline text-yellow">12s</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Tempo médio</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">chat</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-28 bg-white/15 rounded mb-1.5" />
                    <div className="h-1.5 w-44 bg-white/[0.08] rounded" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">IA</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-purple-400 text-sm">person</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-36 bg-white/15 rounded mb-1.5" />
                    <div className="h-1.5 w-32 bg-white/[0.08] rounded" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-yellow/10 text-yellow text-[9px] font-bold">Quente</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-400 text-sm">schedule</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-white/15 rounded mb-1.5" />
                    <div className="h-1.5 w-40 bg-white/[0.08] rounded" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">Agendado</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <div className="flex-1 text-xs text-text-muted">IA analisando 3 conversas em tempo real...</div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -top-4 -right-4 glass-card rounded-xl p-3 flex items-center gap-3 shadow-xl shadow-black/30 border-emerald-500/20"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-text-white">Lead convertido</div>
                <div className="text-[10px] text-emerald-400">agora mesmo</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
