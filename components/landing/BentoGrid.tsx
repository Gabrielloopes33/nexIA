"use client";

import { motion } from "framer-motion";
import { BENTO } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/animations";

export function BentoGrid() {
  const { cards } = BENTO;

  return (
    <section className="py-24 bg-section-bg px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-16 max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger()}
        >
          <motion.span
            variants={fadeUp}
            className="text-primary-light font-bold tracking-[0.2em] text-sm uppercase block mb-4"
          >
            {BENTO.tag}
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-text-white mb-6 leading-[1.1]"
          >
            {BENTO.title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-text-muted text-lg md:text-xl font-medium max-w-2xl"
          >
            {BENTO.subtitle}
          </motion.p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger()}
        >
          {/* Card A: Conversations — 2col, 2row */}
          <motion.div
            variants={fadeUp}
            className="glass-card md:col-span-2 row-span-2 rounded-xl p-8 flex flex-col overflow-hidden group"
          >
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary-light text-2xl">
                  {cards.conversations.icon}
                </span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-text-white mb-3">
                {cards.conversations.title}
              </h3>
              <p className="text-text-muted mb-10 max-w-md">
                {cards.conversations.description}
              </p>

              {/* Illustration */}
              <div className="mt-auto relative bg-black rounded-xl p-4 border border-white/5 h-64 overflow-hidden translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                <div className="flex gap-2 mb-4 border-b border-white/5 pb-4">
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {cards.conversations.channels[0]}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">
                    {cards.conversations.channels[1]}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                    {cards.conversations.channels[2]}
                  </div>
                </div>
                <div className="space-y-3">
                  {cards.conversations.contacts.map((c) => (
                    <div
                      key={c.initials}
                      className="p-3 bg-surface-high rounded-lg flex items-center gap-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold ${c.color}`}
                      >
                        {c.initials}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-24 bg-white/20 rounded mb-2" />
                        <div className="h-1.5 w-48 bg-white/10 rounded" />
                      </div>
                      {c.time && (
                        <div className="text-[10px] text-text-muted italic">
                          {c.time}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card B: Pipeline — 1col, 2row */}
          <motion.div
            variants={fadeUp}
            className="glass-card md:col-span-1 row-span-2 rounded-xl p-8 flex flex-col group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary-light text-2xl">
                {cards.pipeline.icon}
              </span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-text-white mb-3">
              {cards.pipeline.title}
            </h3>
            <p className="text-text-muted mb-10">
              {cards.pipeline.description}
            </p>

            <div className="mt-auto bg-black rounded-xl p-4 border border-white/5 flex gap-3 h-full max-h-[300px] group-hover:bg-surface-low transition-colors duration-500">
              {cards.pipeline.stages.map((stage, i) => (
              <div key={stage} className="flex-1 space-y-2">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                  {stage}
                </span>
                {i === 0 && (
                  <>
                    <div className="h-12 bg-surface-high rounded border-l-2 border-primary" />
                    <div className="h-12 bg-surface-high rounded opacity-40" />
                  </>
                )}
                {i === 1 && (
                  <div className="h-16 bg-surface-high rounded border-l-2 border-yellow" />
                )}
                {i === 2 && (
                <div className="h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">
                    check_circle
                  </span>
                </div>
                )}
              </div>
              ))}
            </div>
          </motion.div>

          {/* Card C: AI */}
          <motion.div
            variants={fadeUp}
            className="glass-card rounded-xl p-8 flex flex-col group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary-light text-2xl">
                {cards.ai.icon}
              </span>
            </div>
            <h3 className="text-xl font-headline font-bold text-text-white mb-2">
              {cards.ai.title}
            </h3>
            <p className="text-text-muted text-sm mb-6">
              {cards.ai.description}
            </p>

            <div className="mt-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-xs">
                  trending_up
                </span>
                {cards.ai.stat}
              </div>
              <div className="space-y-2">
                {cards.ai.bars.map((bar) => (
                  <div key={bar.label} className="flex items-center gap-2">
                    <div className="h-1.5 w-full bg-surface-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          bar.label === "Intenção"
                            ? "bg-primary"
                            : "bg-yellow"
                        }`}
                        style={{ width: bar.width }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card D: Lead History */}
          <motion.div
            variants={fadeUp}
            className="glass-card rounded-xl p-8 flex flex-col group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary-light text-2xl">
                {cards.leadHistory.icon}
              </span>
            </div>
            <h3 className="text-xl font-headline font-bold text-text-white mb-2">
              {cards.leadHistory.title}
            </h3>
            <p className="text-text-muted text-sm mb-6">
              {cards.leadHistory.description}
            </p>

            <div className="mt-auto flex items-center gap-3 bg-surface-low p-3 rounded-lg border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#a88cfb] flex items-center justify-center font-bold text-white text-xs">
                MR
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded bg-yellow/10 text-yellow text-[10px] font-bold">
                  {cards.leadHistory.tags[0]}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  {cards.leadHistory.tags[1]}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card E: Agenda */}
          <motion.div
            variants={fadeUp}
            className="glass-card rounded-xl p-8 flex flex-col group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary-light text-2xl">
                {cards.agenda.icon}
              </span>
            </div>
            <h3 className="text-xl font-headline font-bold text-text-white mb-2">
              {cards.agenda.title}
            </h3>
            <p className="text-text-muted text-sm mb-6">
              {cards.agenda.description}
            </p>

            <div className="mt-auto space-y-2">
              <div className="flex items-center gap-3 p-2 bg-black rounded border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_box_outline_blank
                </span>
                <div className="h-1.5 w-24 bg-white/20 rounded" />
              </div>
              <div className="flex items-center gap-3 p-2 bg-black rounded border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_box
                </span>
                <div className="h-1.5 w-20 bg-white/40 rounded" />
              </div>
              <div className="flex items-center gap-3 p-2 bg-black rounded border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_box_outline_blank
                </span>
                <div className="h-1.5 w-16 bg-white/20 rounded" />
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
