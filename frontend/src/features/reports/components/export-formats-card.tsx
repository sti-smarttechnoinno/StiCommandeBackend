'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, FileSpreadsheet, Printer, Download } from 'lucide-react';

const FORMATS = [
  { id: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" />, color: 'text-rose-600 bg-rose-500/10 hover:bg-rose-500/20' },
  { id: 'excel', label: 'Excel', icon: <FileSpreadsheet className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { id: 'csv', label: 'CSV', icon: <Download className="h-4 w-4" />, color: 'text-blue-600 bg-blue-500/10 hover:bg-blue-500/20' },
  { id: 'print', label: 'Print', icon: <Printer className="h-4 w-4" />, color: 'text-amber-600 bg-amber-500/10 hover:bg-amber-500/20' },
];

export function ExportFormatsCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Export Formats
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((format) => (
            <Button
              key={format.id}
              variant="outline"
              className="h-12 rounded-xl border-border/40 text-xs font-semibold gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => toast.success(`Exporting as ${format.label}`)}
            >
              <span className={format.color + ' w-7 h-7 rounded-lg flex items-center justify-center'}>
                {format.icon}
              </span>
              {format.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
