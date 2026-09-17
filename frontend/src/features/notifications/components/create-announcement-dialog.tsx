'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNotificationsStore } from '../store';
import { notificationsService } from '@/services/notifications';
import { toast } from 'sonner';
import { Megaphone, X, Loader2, Send, Calendar, Shield, Users, Tag, AlertTriangle } from 'lucide-react';

export function CreateAnnouncementDialog() {
  const { isAnnouncementDialogOpen, setAnnouncementDialogOpen, triggerRefresh } = useNotificationsStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('high');
  const [targetAudience, setTargetAudience] = useState('all');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await notificationsService.createAnnouncement({
        title: title.trim(),
        description: message.trim(),
        scheduledAt: sendImmediately ? undefined : scheduledAt,
      });

      toast.success('Announcement Published!', {
        description: `"${title}" has been published and broadcasted to system users.`,
      });

      triggerRefresh();
      setAnnouncementDialogOpen(false);
      setTitle('');
      setMessage('');
      setScheduledAt('');
    } catch {
      toast.error('Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isAnnouncementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
      <DialogContent showCloseButton={false} className="max-w-5xl sm:max-w-5xl w-[92vw] rounded-[28px] p-0 overflow-hidden max-h-[90vh] flex flex-col bg-card border border-border/60 shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="px-8 py-6 bg-muted/30 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0 shadow-xs">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                  Publish System Announcement
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Broadcast operational alerts, maintenance windows, or system updates to all users.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAnnouncementDialogOpen(false)}
              className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {/* Main Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" /> Announcement Title *
            </label>
            <Input
              placeholder="e.g. Planned Server Maintenance Tonight (22:00 - 02:00)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="!h-11 rounded-xl text-xs border-border/60 bg-background font-medium shadow-xs"
            />
          </div>

          {/* 3 Select Controls in One Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Category */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 h-5 whitespace-nowrap">
                <Tag className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Category
              </label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? 'general')}>
                <SelectTrigger className="!h-11 data-[size=default]:!h-11 rounded-xl border-border/60 text-xs bg-background w-full px-3.5 font-medium flex items-center justify-between shadow-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 shadow-lg">
                  <SelectItem value="general" className="text-xs font-medium cursor-pointer py-2">
                    General Notice
                  </SelectItem>
                  <SelectItem value="maintenance" className="text-xs font-medium cursor-pointer py-2">
                    System Maintenance
                  </SelectItem>
                  <SelectItem value="update" className="text-xs font-medium cursor-pointer py-2">
                    Platform Feature Update
                  </SelectItem>
                  <SelectItem value="policy" className="text-xs font-medium cursor-pointer py-2">
                    Policy & Operational Update
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 h-5 whitespace-nowrap">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" /> Priority Level
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? 'high')}>
                <SelectTrigger className="!h-11 data-[size=default]:!h-11 rounded-xl border-border/60 text-xs bg-background w-full px-3.5 font-medium flex items-center justify-between shadow-xs">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 shadow-lg">
                  <SelectItem value="critical" className="text-xs font-medium cursor-pointer py-2 text-rose-600">
                    Critical Alert (High Visibility)
                  </SelectItem>
                  <SelectItem value="high" className="text-xs font-medium cursor-pointer py-2 text-amber-600">
                    High Priority
                  </SelectItem>
                  <SelectItem value="medium" className="text-xs font-medium cursor-pointer py-2 text-blue-600">
                    Medium Priority
                  </SelectItem>
                  <SelectItem value="low" className="text-xs font-medium cursor-pointer py-2 text-muted-foreground">
                    Low / Standard Priority
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 h-5 whitespace-nowrap">
                <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Target Audience
              </label>
              <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v ?? 'all')}>
                <SelectTrigger className="!h-11 data-[size=default]:!h-11 rounded-xl border-border/60 text-xs bg-background w-full px-3.5 font-medium flex items-center justify-between shadow-xs">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 shadow-lg">
                  <SelectItem value="all" className="text-xs font-medium cursor-pointer py-2">
                    All System Users
                  </SelectItem>
                  <SelectItem value="delegates" className="text-xs font-medium cursor-pointer py-2">
                    Field Delegates Only
                  </SelectItem>
                  <SelectItem value="admins" className="text-xs font-medium cursor-pointer py-2">
                    Administrators & Managers
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Announcement Message Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-emerald-500" /> Announcement Details & Message *
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {message.length} characters
              </span>
            </div>
            <textarea
              placeholder="Write the full announcement text, instructions, or operational details for your team..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-36 rounded-2xl border border-border/60 bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none shadow-xs font-medium leading-relaxed"
            />
          </div>

          {/* Broadcast Options & Scheduling */}
          <div className="p-4 rounded-2xl border border-border/50 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sendNow"
                  checked={sendImmediately}
                  onCheckedChange={(v) => setSendImmediately(v === true)}
                />
                <label htmlFor="sendNow" className="text-xs font-bold text-foreground cursor-pointer">
                  Publish and broadcast immediately upon saving
                </label>
              </div>
            </div>

            {!sendImmediately && (
              <div className="pt-2 max-w-sm space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Schedule Publication Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="!h-11 rounded-xl text-xs border-border/60 bg-background font-medium shadow-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="px-8 py-5 bg-card border-t border-border/40 shrink-0">
          <div className="flex items-center gap-3.5 w-full justify-end">
            <Button
              variant="outline"
              className="h-11 px-6 rounded-xl text-xs font-semibold border-border/60 hover:bg-muted"
              onClick={() => setAnnouncementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-11 px-7 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !message.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
