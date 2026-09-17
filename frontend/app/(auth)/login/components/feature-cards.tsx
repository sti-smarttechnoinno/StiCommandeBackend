'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Package, Smartphone, Users, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: <Package className="h-5 w-5" />,
    title: 'Order Management',
    description: 'Create, validate and monitor distribution orders.',
    color: 'text-[#D71920]',
    bg: 'bg-[#FEF2F2]',
  },
  {
    icon: <Smartphone className="h-5 w-5" />,
    title: 'SIM & Mobile Credit',
    description: 'Manage inventory and mobile credit distribution.',
    color: 'text-[#2563EB]',
    bg: 'bg-[#EFF6FF]',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Delegate Network',
    description: 'Monitor delegates, regions and client coverage.',
    color: 'text-[#22C55E]',
    bg: 'bg-[#F0FDF4]',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Real-Time Analytics',
    description: 'Track KPIs, revenue and operational performance instantly.',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#FFFBEB]',
  },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-[700px] mt-4">
      {FEATURES.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
          className={cn(
            'group bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-3.5 shadow-xs',
            'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left'
          )}
        >
          <div>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 duration-200', feature.bg, feature.color)}>
              {feature.icon}
            </div>
            <h3 className="text-xs font-bold text-[#111827] mb-1 leading-snug">
              {feature.title}
            </h3>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              {feature.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
