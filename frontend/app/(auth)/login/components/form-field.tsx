'use client';

import { memo, forwardRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
}

export const FormField = memo(
  forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
    { label, icon: Icon, error, rightElement, className, id, ...props },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-1.5 text-left w-full">
        <label htmlFor={inputId} className="block text-xs font-semibold text-foreground">
          {label}
        </label>

        <div className="relative flex items-center">
          {Icon && (
            <Icon
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors"
              aria-hidden="true"
            />
          )}

          <Input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'w-full h-11 rounded-xl text-sm border border-border/60 bg-muted/20 text-foreground placeholder:text-muted-foreground/70',
              Icon ? 'pl-10' : 'pl-3.5',
              rightElement ? 'pr-10' : 'pr-3.5',
              'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4',
              'transition-all duration-200 outline-none shadow-2xs',
              error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  })
);
