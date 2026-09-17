'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '../store';
import { toast } from 'sonner';
import { Download, Upload, RotateCcw, Save, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function SettingsHeader() {
  const { isSaving, setIsSaving, setLastSaved } = useSettingsStore();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved('Just now');
      toast.success('Settings saved successfully');
    }, 1200);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
          <span>Home</span>
          <span>/</span>
          <span className="text-primary font-bold">settings</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ERP Settings & Configuration</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-none text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(), 'dd MMM yyyy')}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full border-border/70 text-xs font-semibold bg-card hover:bg-muted/80"
          onClick={() => toast.success('Configuration exported')}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export Config
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full border-border/70 text-xs font-semibold bg-card hover:bg-muted/80"
          onClick={() => toast.info('Changes reset')}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>

        <Button
          size="sm"
          className="h-9 px-4 rounded-full text-xs font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
