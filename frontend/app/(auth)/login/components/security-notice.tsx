'use client';

import { memo } from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityNotice = memo(function SecurityNotice() {
  return (
    <div className="mt-6 p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-left">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your session is protected with enterprise-grade encryption and secure authentication.
        </p>
      </div>
    </div>
  );
});
