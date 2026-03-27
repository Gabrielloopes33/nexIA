"use client";

import { motion } from "framer-motion";
import { VALUE_STACK } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function ValueStack() {
  return (
    <section className="py-24 bg-section-bg" id="precos">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.15)}
        >
          <motion.span
            variants={fadeUp}
            className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4 block"
          >
            {VALUE_STACK.tag}
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight mb-4"
          >
            {VALUE_STACK.title}
          </motion.h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.15)}
        >
          {VALUE_STACK.plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`glass-card p-8 transition-all relative overflow-hidden ${
                plan.featured
                  ? "border-yellow/40 bg-section-bg shadow-2xl shadow-yellow/5"
                  : "premium" in plan && plan.premium
                  ? "border-primary/40 bg-gradient-to-b from-primary/5 to-transparent"
                  : "border-primary/20 hover:border-primary/40"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-yellow text-page-bg text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              <h3 className="font-headline font-bold text-2xl mb-2">
                {plan.name}
              </h3>
              <p className="text-text-muted text-sm mb-6">{plan.subtitle}</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-text-white">
                  {plan.price}
                </span>
                {"savings" in plan && typeof plan.savings === "string" && (
                  <span className="text-text-muted text-sm block mt-1">
                    {plan.savings}
                  </span>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className={`flex items-center gap-3 text-sm ${
                      plan.featured
                        ? "font-semibold text-text-white"
                        : "text-text-body"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 shrink-0 ${
                        plan.featured ? "text-yellow" : "text-primary"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center font-bold py-4 rounded-xl transition-all ${
                  plan.featured
                    ? "cta-yellow font-extrabold py-5 text-lg shadow-xl shadow-yellow/20 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-surface-high text-text-white border border-white/10 hover:bg-surface-bright"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
