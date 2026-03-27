"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BIO } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function Bio() {
  return (
    <section className="py-24 bg-page-bg">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <motion.div
          className="flex flex-col md:flex-row items-center md:items-center gap-10 text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.12)}
        >
          <motion.div
            variants={fadeUp}
            className="w-40 h-40 rounded-full overflow-hidden border-4 border-yellow/20 shrink-0"
          >
            <Image
              src="/ana-paula-perci.jpg"
              alt={BIO.name}
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="flex flex-col">
            <motion.span
              variants={fadeUp}
              className="text-sm font-bold tracking-[0.2em] text-yellow uppercase mb-4 block"
            >
              {BIO.tag}
            </motion.span>

            <motion.h2
              variants={fadeUp}
              className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl headline-tight mb-6"
            >
              {BIO.name}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-yellow font-headline font-bold text-xl md:text-2xl leading-snug mb-6"
            >
              {BIO.highlight}
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-text-body text-lg leading-relaxed mb-8"
            >
              {BIO.description}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
