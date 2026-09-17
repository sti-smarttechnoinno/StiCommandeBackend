'use client';

import { memo } from 'react';

export const LoginFooter = memo(function LoginFooter() {
  return (
    <footer className="mt-6 text-center space-y-1.5 text-xs text-muted-foreground">
      <p className="font-mono text-[11px] font-semibold text-muted-foreground">STI ERP v1.0</p>
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} STI Distribution. All rights reserved.</span>
      </div>
    </footer>
  );
});
