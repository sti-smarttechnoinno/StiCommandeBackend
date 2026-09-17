'use client';

import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface RememberMeProps {
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const RememberMe = memo(function RememberMe({
  rememberMe,
  onRememberMeChange,
  disabled = false,
}: RememberMeProps) {
  return (
    <div className="flex items-center justify-start w-full pt-1">
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <Checkbox
          checked={rememberMe}
          onCheckedChange={(checked) => onRememberMeChange(checked === true)}
          disabled={disabled}
          className="border-border/60 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 transition-colors"
        />
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Remember me
        </span>
      </label>
    </div>
  );
});
