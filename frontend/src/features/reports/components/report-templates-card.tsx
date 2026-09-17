'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOCK_REPORT_TEMPLATES } from '../mock-data';
import { toast } from 'sonner';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Warehouse,
  Package,
  UserCheck,
  MapPin,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Calendar: <Calendar className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Warehouse: <Warehouse className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  UserCheck: <UserCheck className="h-5 w-5" />,
  MapPin: <MapPin className="h-5 w-5" />,
};

const ICON_COLORS = [
  'bg-emerald-500/10 text-emerald-600',
  'bg-blue-500/10 text-blue-600',
  'bg-orange-500/10 text-orange-600',
  'bg-indigo-500/10 text-indigo-600',
  'bg-amber-500/10 text-amber-600',
  'bg-rose-500/10 text-rose-600',
  'bg-purple-500/10 text-purple-600',
  'bg-teal-500/10 text-teal-600',
];

export function ReportTemplatesCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Report Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MOCK_REPORT_TEMPLATES.map((template, i) => (
            <Button
              key={template.id}
              variant="ghost"
              className="h-auto p-3 rounded-xl justify-start gap-3 hover:bg-muted/40 transition-all group"
              onClick={() => toast.success(`Opening ${template.title} template`)}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', ICON_COLORS[i])}>
                {ICON_MAP[template.icon]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="block text-xs font-semibold text-foreground">{template.title}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{template.description}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
