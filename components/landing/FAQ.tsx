"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQ as FAQ_COPY } from "@/lib/copy";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-page-bg" id="faq">
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4 block">
            {FAQ_COPY.tag}
          </span>
          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight">
            {FAQ_COPY.title}
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQ_COPY.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="glass-card p-6 cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-text-white pr-8">
                    {item.question}
                  </h4>
                  <motion.svg
                    className="w-5 h-5 text-text-muted shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-text-body text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
