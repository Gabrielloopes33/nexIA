"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";
import { DashboardMockup } from "./DashboardMockup";

export function Features() {
  return (
    <section className="py-24 bg-page-bg relative overflow-hidden" id="features">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[150px] -z-0" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger()}
        >
          <motion.span
            variants={fadeUp}
            className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4 block"
          >
            {FEATURES.tag}
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight mb-6"
          >
            {FEATURES.title}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-body text-xl max-w-2xl mx-auto">
            {FEATURES.subtitle}
          </motion.p>
        </motion.div>

        {/* Dashboard Mockup */}
        <DashboardMockup />

        <motion.div
          className="relative mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger()}
        >
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

          <div className="space-y-6">
            {FEATURES.items.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                className="relative flex items-start gap-6 md:gap-8 pl-14 md:pl-20 group"
              >
                <div className="absolute left-[14px] md:left-[22px] top-7 w-5 h-5 rounded-full border-2 border-primary/40 bg-page-bg flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_12px_rgba(70,52,127,0.5)] transition-all duration-500">
                  <div className="w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors duration-500" />
                </div>

                <div className="flex-1 glass-card p-6 md:p-8 group-hover:border-primary/30 group-hover:shadow-[0_4px_40px_rgba(70,52,127,0.1)] transition-all duration-500">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 group-hover:scale-110 transition-all duration-500">
                      <span className="material-symbols-outlined text-2xl">
                        {feat.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline font-bold text-lg md:text-xl text-text-white">
                          {feat.title}
                        </h3>
                        <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest text-primary/40 uppercase">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-text-body leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
