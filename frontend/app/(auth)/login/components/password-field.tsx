'use client';

import { memo, forwardRef, useState, useCallback } from 'react';
import { FormField, type FormFieldProps } from './form-field';
import { Lock, Eye, EyeOff } from 'lucide-react';

export type PasswordFieldProps = Omit<FormFieldProps, 'icon' | 'type' | 'rightElement'>;

export const PasswordField = memo(
  forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    return (
      <FormField
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        icon={Lock}
        rightElement={
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  })
);
