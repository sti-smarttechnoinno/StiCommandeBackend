'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const TASKS = [
  { id: '1', text: 'Review pending order approvals (8)', checked: false },
  { id: '2', text: 'Validate delegated stock transfers', checked: false },
  { id: '3', text: 'Morning briefing with team', checked: true },
  { id: '4', text: 'Prepare weekly performance report', checked: false },
  { id: '5', text: 'Follow up on 3 delayed deliveries', checked: false },
];

export function TasksPanel() {
  const [tasks, setTasks] = useState(TASKS);

  const toggle = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Today&apos;s Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          <div className="space-y-1">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => toggle(task.id)}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className={cn('text-[13px] flex-1', task.checked && 'line-through text-muted-foreground')}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
