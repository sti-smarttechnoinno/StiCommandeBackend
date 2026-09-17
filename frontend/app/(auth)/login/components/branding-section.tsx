'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function BrandingSection() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center text-center w-[50%] max-w-[580px] px-8 py-6 mx-auto my-auto select-none space-y-6">
      {/* Brand Identity Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center w-full space-y-3"
      >
        {/* STI Logo */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <Image
            src="/assets/logo-sti.png"
            alt="STI Logo"
            width={112}
            height={112}
            className="object-contain w-28 h-28 drop-shadow-md"
            priority
          />
        </div>

        {/* Exclusive Ooredoo Partner Label */}
        <p className="text-xs font-bold uppercase tracking-wider text-[#ED1C24]">
          Distributeur Officiel Agréé Ooredoo
        </p>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            STI Distribution
          </h1>
          <p className="text-sm font-semibold text-muted-foreground">
            Système ERP de Gestion & Distribution Ooredoo
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="w-12 h-1 bg-[#ED1C24] rounded-full mx-auto" />
      </motion.div>

      {/* Minimalist Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-[460px] mx-auto text-center"
      >
        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
          Plateforme centralisée pour la gestion exclusive des flux Ooredoo : transferts de crédit Storm, approvisionnement SIM, commandes et suivi des délégués sur le terrain.
        </p>
      </motion.div>

      {/* 3 Clean Specialized Pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1"
      >
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/50 text-xs font-semibold text-foreground shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24]" />
          Crédit Ooredoo Storm
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/50 text-xs font-semibold text-foreground shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24]" />
          SIMs & Cartes de Recharge
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/50 text-xs font-semibold text-foreground shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24]" />
          Réseau Délégués Ooredoo
        </div>
      </motion.div>
    </div>
  );
}
