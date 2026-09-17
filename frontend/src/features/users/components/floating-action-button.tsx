'use client';

import { Button } from '@/components/ui/button';
import { useUsersStore } from '../store';
import { Plus } from 'lucide-react';

export function FloatingActionButton() {
  const { setNewUserDialogOpen } = useUsersStore();

  return (
    <Button
      onClick={() => setNewUserDialogOpen(true)}
      className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-[#D71920] hover:bg-[#B81419] text-white shadow-xl shadow-[#D71920]/30 hover:shadow-2xl hover:shadow-[#B81419]/40 hover:scale-110 active:scale-95 transition-all duration-200 z-50 lg:hidden"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
