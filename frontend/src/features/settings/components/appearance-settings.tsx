'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Palette, Monitor, Moon, Sun } from 'lucide-react';

const THEMES = [
  { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { id: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const ACCENT_COLORS = ['#D71920', '#2563EB', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4'];

export function AppearanceSettings() {
  const [theme, setTheme] = useState('light');
  const [accent, setAccent] = useState('#D71920');
  const [sidebarStyle, setSidebarStyle] = useState('default');
  const [density, setDensity] = useState('comfortable');
  const [fontSize, setFontSize] = useState('medium');

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Theme */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  theme === t.id ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border/60'
                )}
              >
                <span className={cn(theme === t.id ? 'text-primary' : 'text-muted-foreground')}>{t.icon}</span>
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Accent Color</label>
          <div className="flex items-center gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className={cn('w-8 h-8 rounded-full transition-all', accent === c && 'ring-2 ring-offset-2 ring-primary')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Style */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Sidebar Style</label>
          <div className="grid grid-cols-3 gap-3">
            {['default', 'compact', 'floating'].map((s) => (
              <button
                key={s}
                onClick={() => setSidebarStyle(s)}
                className={cn(
                  'p-3 rounded-xl border-2 text-xs font-semibold capitalize transition-all',
                  sidebarStyle === s ? 'border-primary bg-primary/5 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/60'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table Density */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Table Density</label>
          <div className="grid grid-cols-2 gap-3">
            {['comfortable', 'compact'].map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  'p-3 rounded-xl border-2 text-xs font-semibold capitalize transition-all',
                  density === d ? 'border-primary bg-primary/5 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/60'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Font Size</label>
          <div className="grid grid-cols-3 gap-3">
            {['small', 'medium', 'large'].map((f) => (
              <button
                key={f}
                onClick={() => setFontSize(f)}
                className={cn(
                  'p-3 rounded-xl border-2 text-xs font-semibold capitalize transition-all',
                  fontSize === f ? 'border-primary bg-primary/5 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/60'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preview</span>
          <div className="mt-3 p-4 rounded-xl bg-card border border-border/40 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: accent }} />
              <div>
                <span className="text-sm font-bold text-foreground">Sample Card</span>
                <span className="text-xs text-muted-foreground block">This is how your content will appear</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
