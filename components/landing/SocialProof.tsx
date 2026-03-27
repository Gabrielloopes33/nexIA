"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SOCIAL_PROOF } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function SocialProof() {
  return (
    <section className="py-24 bg-page-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          className="text-center mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.15)}
        >
          <motion.span
            variants={fadeUp}
            className="text-sm font-bold tracking-[0.2em] text-yellow uppercase mb-4 block"
          >
            {SOCIAL_PROOF.tag}
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight mb-6"
          >
            {SOCIAL_PROOF.title}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-body text-xl max-w-2xl mx-auto">
            {SOCIAL_PROOF.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.15)}
        >
          {SOCIAL_PROOF.testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="glass-card p-8 relative"
            >
              <span className="text-6xl text-yellow/20 absolute top-4 left-4 font-serif">
                &ldquo;
              </span>
              <p className="text-text-white mb-8 relative z-10 font-medium italic">
                {t.quote}
              </p>
              <div className="flex items-center gap-4">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-text-white text-sm">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
