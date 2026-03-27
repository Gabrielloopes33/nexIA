"use client";

import { motion } from "framer-motion";
import { HERO } from "@/lib/copy";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 hero-glow -z-10" />
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text — left */}
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <span className="text-yellow text-sm">&#9889;</span>
              <span className="text-xs font-semibold tracking-wider uppercase text-text-white">
                {HERO.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-headline font-extrabold text-4xl sm:text-5xl md:text-6xl headline-tight mb-8 text-text-white"
            >
              {HERO.headlinePart1}
              <span className="text-yellow">{HERO.headlineHighlight}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="font-body text-lg md:text-xl text-text-body max-w-lg mb-10 leading-relaxed"
            >
              {HERO.subtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <a
                href="#precos"
                className="cta-yellow font-bold px-8 py-4 rounded-xl text-lg shadow-2xl shadow-yellow/30 hover:scale-[1.05] transition-all inline-flex items-center gap-2"
              >
                {HERO.cta}
                <span className="text-xl">&rarr;</span>
              </a>
            </motion.div>

            <div className="pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-60">
              {HERO.stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={4 + i}
                  className="flex flex-col"
                >
                  <span className="text-2xl font-bold text-text-white font-headline">
                    {stat.value}
                  </span>
                  <span className="text-xs text-text-muted uppercase tracking-widest">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Phone mockup — right */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative w-[300px] md:w-[340px]">
              {/* Phone frame */}
              <div className="bg-surface-variant rounded-[40px] p-3 shadow-2xl shadow-primary/20 border border-white/10">
                <div className="bg-page-bg rounded-[32px] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <span className="text-[10px] text-text-muted font-medium">9:41</span>
                    <div className="w-20 h-5 bg-surface-variant rounded-full" />
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-text-muted/40 rounded-sm" />
                      <div className="w-2 h-2 bg-text-muted/40 rounded-full" />
                    </div>
                  </div>

                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-white">NexIA Bot</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Online agora
                      </div>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="px-4 py-5 space-y-4 min-h-[360px]">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-text-white">Oi, quero saber mais sobre o plano semestral</p>
                        <span className="text-[9px] text-text-muted block text-right mt-1">14:32</span>
                      </div>
                    </div>

                    {/* Bot message */}
                    <div className="flex justify-start">
                      <div className="bg-surface-high rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                        <p className="text-sm text-text-white">Olá! 😊 O plano semestral inclui 5 atendentes, integração com WhatsApp, Instagram e IA nativa.</p>
                        <span className="text-[9px] text-text-muted block mt-1">14:32</span>
                      </div>
                    </div>

                    {/* Bot message 2 */}
                    <div className="flex justify-start">
                      <div className="bg-surface-high rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                        <p className="text-sm text-text-white">Posso te mostrar como funciona na prática? Leva 2 minutos.</p>
                        <span className="text-[9px] text-text-muted block mt-1">14:32</span>
                      </div>
                    </div>

                    {/* Quick replies */}
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-medium">Sim, quero ver!</span>
                      <span className="px-3 py-1.5 rounded-full border border-white/10 text-text-muted text-xs">Ver preços</span>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="bg-surface-high rounded-2xl px-4 py-3 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -left-6 top-24 glass-card rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl shadow-black/40"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="material-symbols-outlined text-emerald-400 text-sm">bolt</span>
                <span className="text-[11px] font-bold text-text-white">Resposta em 3s</span>
              </motion.div>

              <motion.div
                className="absolute -right-6 bottom-32 glass-card rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl shadow-black/40"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <span className="material-symbols-outlined text-yellow text-sm">psychology</span>
                <span className="text-[11px] font-bold text-text-white">IA qualificando</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
