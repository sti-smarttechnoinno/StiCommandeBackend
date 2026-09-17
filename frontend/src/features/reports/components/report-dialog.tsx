'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useReportsStore } from '../store';
import { reportsService } from '@/services/reports';
import { toast } from 'sonner';
import { FileText, X, Loader2 } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'revenue', label: 'Revenue Analysis' },
  { value: 'delegate', label: 'Delegate Performance' },
  { value: 'warehouse', label: 'Warehouse Activity' },
  { value: 'stock', label: 'Stock Report' },
  { value: 'client', label: 'Client Activity' },
  { value: 'regional', label: 'Regional Revenue' },
  { value: 'financial', label: 'Monthly Financial' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

export function ReportDialog() {
  const { isCreateDialogOpen, setCreateDialogOpen, triggerRefresh } = useReportsStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('sales');
  const [period, setPeriod] = useState('this_month');
  const [format, setFormat] = useState('pdf');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await reportsService.createReport({
        name: name.trim(),
        type,
        period,
        format,
      });

      toast.success('Report Created Successfully!', {
        description: `"${name}" has been generated as ${format.toUpperCase()}`,
      });

      triggerRefresh();
      setCreateDialogOpen(false);
      setName('');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="max-w-[640px] rounded-[28px] p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Create New Report
            </DialogTitle>
            <button
              onClick={() => setCreateDialogOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-8 py-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Report Name</label>
            <Input
              placeholder="e.g., Monthly Sales Summary - July 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-border/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Report Type</label>
              <Select value={type} onValueChange={(v) => setType(v ?? '')}>
                <SelectTrigger className="h-12 rounded-xl border-border/60">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Export Format</label>
              <Select value={format} onValueChange={(v) => setFormat(v ?? 'pdf')}>
                <SelectTrigger className="h-12 rounded-xl border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" className="h-12 rounded-xl border-border/60" />
              <Input type="date" className="h-12 rounded-xl border-border/60" />
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 pt-0">
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl text-sm font-semibold border-border/60"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : 'Generate Report'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
