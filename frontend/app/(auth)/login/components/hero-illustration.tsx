'use client';

import { motion } from 'framer-motion';

export function HeroIllustration() {
  return (
    <div className="relative w-full h-[270px] xl:h-[300px] max-w-[700px] mx-auto flex items-center justify-center select-none overflow-hidden">
      <svg viewBox="0 0 720 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <defs>
          <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>

          <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#D71920" floodOpacity="0.12" />
          </filter>

          <linearGradient id="primaryGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D71920" />
            <stop offset="100%" stopColor="#B81419" />
          </linearGradient>

          <linearGradient id="blueGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* FLOATING BACKGROUND ELEMENTS (20% Opacity) */}
        <g opacity="0.2">
          <motion.g animate={{ y: [-4, 4, -4] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M 80 50 A 20 20 0 0 1 120 40 A 25 25 0 0 1 160 50 A 15 15 0 0 1 150 70 L 90 70 A 15 15 0 0 1 80 50 Z" fill="#94A3B8" />
          </motion.g>

          <motion.g animate={{ y: [4, -4, 4] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M 580 60 A 18 18 0 0 1 615 50 A 22 22 0 0 1 650 60 A 14 14 0 0 1 640 78 L 590 78 Z" fill="#94A3B8" />
          </motion.g>

          <circle cx="90" cy="180" r="24" stroke="#D71920" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
          <circle cx="630" cy="180" r="28" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

          <path d="M 640 380 L 655 372 L 670 380 L 670 395 C 670 405 655 412 655 412 C 655 412 640 405 640 395 Z" fill="#22C55E" />
          <circle cx="75" cy="380" r="14" fill="#D71920" />
        </g>



        {/* LEFT: TELECOM TOWER WITH RADIO WAVES */}
        <g transform="translate(35, 120)" filter="url(#softShadow)">
          <rect x="26" y="20" width="8" height="150" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M 12 170 L 26 20 L 34 20 L 48 170 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="18" y1="60" x2="42" y2="60" stroke="#D71920" strokeWidth="2.5" />
          <line x1="22" y1="100" x2="38" y2="100" stroke="#D71920" strokeWidth="2.5" />
          <line x1="24" y1="135" x2="36" y2="135" stroke="#D71920" strokeWidth="2.5" />

          <motion.path
            d="M 15 12 Q 30 -5 45 12"
            stroke="#D71920"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.path
            d="M 5 2 Q 30 -22 55 2"
            stroke="#D71920"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </g>

        {/* RIGHT: MONITOR WITH STI ERP DASHBOARD */}
        <g transform="translate(500, 100)" filter="url(#softShadow)">
          <rect x="55" y="195" width="40" height="25" fill="#94A3B8" rx="2" />
          <rect x="35" y="215" width="80" height="8" fill="#64748B" rx="4" />
          <rect x="0" y="0" width="185" height="200" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />

          <rect x="0" y="0" width="185" height="24" rx="14" fill="#F8FAFC" />
          <circle cx="12" cy="12" r="3" fill="#EF4444" />
          <circle cx="22" cy="12" r="3" fill="#F59E0B" />
          <circle cx="32" cy="12" r="3" fill="#22C55E" />
          <rect x="45" y="8" width="60" height="8" rx="4" fill="#E2E8F0" />

          <rect x="8" y="30" width="40" height="162" rx="6" fill="#F1F5F9" />
          {['Dashboard', 'Orders', 'Clients', 'SIMs', 'Delegates', 'Inventory', 'Reports'].map((item, idx) => (
            <rect
              key={item}
              x="12"
              y={36 + idx * 22}
              width="32"
              height="14"
              rx="4"
              fill={idx === 0 ? '#D71920' : '#E2E8F0'}
              opacity={idx === 0 ? 0.9 : 0.6}
            />
          ))}

          <rect x="54" y="32" width="58" height="28" rx="6" fill="#EFF6FF" />
          <rect x="118" y="32" width="58" height="28" rx="6" fill="#FEF2F2" />

          <rect x="54" y="66" width="122" height="70" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <path d="M 60 120 L 80 100 L 100 110 L 120 85 L 140 95 L 165 75" stroke="#D71920" strokeWidth="2.5" fill="none" />
          <motion.rect x="62" y="105" width="8" height="20" rx="2" fill="#2563EB" animate={{ height: [12, 22, 12] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.rect x="74" y="95" width="8" height="30" rx="2" fill="#D71920" animate={{ height: [20, 32, 20] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
          <motion.rect x="86" y="100" width="8" height="25" rx="2" fill="#22C55E" animate={{ height: [15, 28, 15] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />

          <rect x="54" y="142" width="122" height="50" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx="80" cy="167" r="16" fill="none" stroke="#2563EB" strokeWidth="5" />
          <circle cx="80" cy="167" r="16" fill="none" stroke="#D71920" strokeWidth="5" strokeDasharray="40 60" />
        </g>

        {/* BOTTOM LEFT: SIM CARDS & SMARTPHONE */}
        <g transform="translate(45, 330)" filter="url(#softShadow)">
          <rect x="0" y="0" width="60" height="38" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="8" y="8" width="16" height="12" rx="2" fill="#EAB308" />
          <rect x="8" y="24" width="40" height="3" rx="1.5" fill="#E2E8F0" />

          <g transform="translate(18, 12)">
            <rect x="0" y="0" width="60" height="38" rx="6" fill="url(#primaryGradient)" />
            <rect x="8" y="8" width="16" height="12" rx="2" fill="#FEF08A" />
            <text x="32" y="22" fontSize="9" fontWeight="bold" fill="#FFFFFF">SIM</text>
          </g>
        </g>

        <g transform="translate(145, 300)" filter="url(#softShadow)">
          <rect x="0" y="0" width="90" height="150" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          <rect x="6" y="10" width="78" height="130" rx="10" fill="#F8FAFC" />
          <rect x="35" y="14" width="20" height="4" rx="2" fill="#CBD5E1" />

          <rect x="12" y="28" width="66" height="36" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
          <text x="18" y="42" fontSize="8" fontWeight="semibold" fill="#64748B">Mobile Credit</text>
          <text x="18" y="56" fontSize="11" fontWeight="bold" fill="#1E40AF">12,500 DA</text>

          <rect x="12" y="70" width="66" height="22" rx="6" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
          <circle cx="20" cy="81" r="4" fill="#22C55E" />
          <text x="28" y="84" fontSize="8" fontWeight="bold" fill="#166534">Transfer Successful</text>

          <motion.g animate={{ scale: [0.97, 1.03, 0.97] }} transition={{ duration: 2, repeat: Infinity }}>
            <rect x="12" y="100" width="66" height="26" rx="8" fill="url(#primaryGradient)" />
            <text x="45" y="116" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">Send Credit</text>
          </motion.g>
        </g>

        {/* BOTTOM CENTER: DELEGATE, TRUCK, STORE */}
        <g transform="translate(265, 340)" filter="url(#softShadow)">
          <rect x="0" y="20" width="100" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M -5 20 L 105 20 L 100 4 L 0 4 Z" fill="url(#primaryGradient)" />
          <rect x="12" y="40" width="30" height="50" rx="4" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />
          <rect x="52" y="45" width="36" height="30" rx="4" fill="#F1F5F9" />
          <text x="50" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">STI STORE</text>
          <rect x="88" y="70" width="14" height="14" rx="2" fill="#D97706" opacity="0.8" />
          <rect x="92" y="58" width="12" height="12" rx="2" fill="#B45309" opacity="0.8" />
        </g>

        <motion.g
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(385, 360)"
          filter="url(#softShadow)"
        >
          <rect x="0" y="0" width="75" height="42" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M 50 0 L 75 12 L 75 42 L 50 42 Z" fill="#D71920" />
          <rect x="56" y="6" width="14" height="12" rx="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="18" cy="42" r="8" fill="#1E293B" />
          <circle cx="18" cy="42" r="3" fill="#94A3B8" />
          <circle cx="58" cy="42" r="8" fill="#1E293B" />
          <circle cx="58" cy="42" r="3" fill="#94A3B8" />
          <text x="24" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#D71920">STI</text>
        </motion.g>

        <g transform="translate(245, 365)">
          <circle cx="10" cy="8" r="7" fill="#D71920" />
          <path d="M 0 35 C 0 20 5 18 10 18 C 15 18 20 20 20 35 Z" fill="#1E293B" />
          <path d="M 4 5 L 16 5 L 18 8 L 2 8 Z" fill="#D71920" />
          <rect x="12" y="20" width="12" height="15" rx="2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
        </g>

        {/* BOTTOM RIGHT: SERVER RACK & 3D CHARTS */}
        <g transform="translate(480, 330)" filter="url(#softShadow)">
          <rect x="0" y="0" width="75" height="85" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          {[12, 34, 56].map((yVal) => (
            <g key={yVal}>
              <rect x="8" y={yVal} width="59" height="16" rx="4" fill="#F1F5F9" />
              <circle cx="16" cy={yVal + 8} r="2.5" fill="#22C55E" />
              <circle cx="24" cy={yVal + 8} r="2.5" fill="#2563EB" />
              <line x1="34" y1={yVal + 8} x2="60" y2={yVal + 8} stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
            </g>
          ))}
          <rect x="22" y="-12" width="32" height="18" rx="9" fill="#336791" />
          <text x="38" y="0" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">PG DB</text>
        </g>

        <g transform="translate(575, 330)" filter="url(#softShadow)">
          <rect x="0" y="0" width="95" height="85" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          <text x="10" y="16" fontSize="8" fontWeight="bold" fill="#64748B">Growth & Delegates</text>

          <rect x="14" y="45" width="10" height="30" rx="2" fill="#CBD5E1" />
          <rect x="28" y="32" width="10" height="43" rx="2" fill="#D71920" />
          <rect x="42" y="24" width="10" height="51" rx="2" fill="#CBD5E1" />
          <rect x="56" y="18" width="10" height="57" rx="2" fill="#D71920" />

          <g transform="translate(70, 52)">
            <circle cx="10" cy="10" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
            <path d="M 4 10 L 8 13 L 16 7" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </g>
      </svg>
    </div>
  );
}
