"use client";

import { motion } from "framer-motion";
import { PROBLEM } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function Problem() {
  return (
    <section className="py-24 bg-section-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger()}
          >
            <motion.span
              variants={fadeUp}
              className="text-sm font-bold tracking-[0.2em] text-red-500 uppercase mb-4 block"
            >
              {PROBLEM.tag}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight mb-8"
            >
              {PROBLEM.title}
            </motion.h2>
            <div className="space-y-6 text-text-body text-lg leading-relaxed">
              {PROBLEM.paragraphs.map((p, i) => (
                <motion.p key={i} variants={fadeUp}>
                  {p}
                </motion.p>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger()}
          >
            {PROBLEM.cards.map((card) => (
              <motion.div
                key={card.title}
                variants={fadeUp}
                className="glass-card p-6 flex flex-col gap-4 group hover:bg-surface-high transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined">
                    {card.icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-text-body">{card.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
