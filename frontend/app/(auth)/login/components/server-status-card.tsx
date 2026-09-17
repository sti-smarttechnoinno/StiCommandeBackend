'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusRow } from './status-row';
import { Server, Database, Zap, Wifi, HardDrive, ShieldCheck } from 'lucide-react';

const SERVICES = [
  { name: 'API Server', status: 'Online', icon: Server },
  { name: 'PostgreSQL', status: 'Connected', icon: Database },
  { name: 'Redis', status: 'Connected', icon: Zap },
  { name: 'Socket.IO', status: 'Live', icon: Wifi },
  { name: 'Background Jobs', status: 'Running', icon: HardDrive },
  { name: 'Storage', status: 'Healthy', icon: ShieldCheck },
];

export const ServerStatusCard = memo(function ServerStatusCard() {
  return (
    <Card className="mt-[24px] bg-white border border-[#E5E7EB] rounded-[18px] p-[24px] shadow-xs w-full text-left">
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111827]">System Status</h3>
          <Badge
            variant="ghost"
            className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            All Systems Operational
          </Badge>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#E5E7EB]">
          {SERVICES.map((service, idx) => (
            <StatusRow
              key={service.name}
              name={service.name}
              status={service.status}
              icon={service.icon}
              isLast={idx === SERVICES.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
