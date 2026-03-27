"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative mt-16 mb-8"
    >
      {/* Browser Frame */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20">
        {/* Browser Header */}
        <div className="bg-surface-variant px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-page-bg rounded-lg px-4 py-1.5 text-xs text-text-muted text-center max-w-md mx-auto">
              app.nexia.chat/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard Image */}
        <div className="relative">
          <Image
            src="/dashboard-real.jpg"
            alt="Dashboard NexIA Chat - Interface real do sistema"
            width={1200}
            height={675}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Floating Stats Card - Top Right */}
      <motion.div
        className="absolute -top-4 -right-4 glass-card rounded-xl p-3 shadow-xl shadow-black/30 hidden md:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-white">+247 leads</div>
            <div className="text-[10px] text-emerald-400">hoje</div>
          </div>
        </div>
      </motion.div>

      {/* Floating AI Card - Bottom Left */}
      <motion.div
        className="absolute -bottom-4 -left-4 glass-card rounded-xl p-3 shadow-xl shadow-black/30 hidden md:block"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">psychology</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-white">IA Ativa</div>
            <div className="text-[10px] text-primary">qualificando</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
