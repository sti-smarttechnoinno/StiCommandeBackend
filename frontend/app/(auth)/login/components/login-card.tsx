'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField } from './form-field';
import { PasswordField } from './password-field';
import { RememberMe } from './remember-me';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { User, ArrowRight, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const LoginCard = memo(function LoginCard() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await login(data.username.trim(), data.password);

        setIsSuccess(true);
        toast.success('Authentication successful', {
          description: `Welcome back, ${data.username}`,
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Invalid username or password. Please try again.';
        setErrorMessage(message);
        toast.error('Authentication failed', {
          description: 'Please check your credentials and try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[460px] mx-auto select-none"
    >
      <Card
        className={cn(
          'bg-card border border-border/40 rounded-2xl overflow-hidden transition-all duration-200',
          'shadow-xs hover:shadow-md',
          isLoading && 'opacity-90'
        )}
      >
        <CardContent className="p-7 sm:p-8 space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 mb-2">
            <div className="w-12 h-12 relative flex items-center justify-center mb-1">
              <Image
                src="/assets/logo-sti.png"
                alt="STI Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>

            <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
              Espace de Connexion
            </h2>
            <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed mx-auto">
              Plateforme Sécurisée de Distribution Ooredoo
            </p>
          </div>

          {/* Dismissable Error Alert */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-3 text-left"
                role="alert"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-destructive truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-destructive hover:opacity-75 p-0.5 rounded-md transition-opacity"
                  aria-label="Dismiss error message"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              label="Username"
              type="text"
              icon={User}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={isLoading || isSuccess}
              error={errors.username?.message}
              {...register('username')}
            />

            <PasswordField
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading || isSuccess}
              error={errors.password?.message}
              {...register('password')}
            />

            <RememberMe
              rememberMe={rememberMe}
              onRememberMeChange={setRememberMe}
              disabled={isLoading || isSuccess}
            />

            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={isLoading || isSuccess}
              className={cn(
                'w-full h-11 rounded-full text-xs font-bold gap-2 mt-1',
                'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground',
                'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30',
                'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground animate-bounce" aria-hidden="true" />
                  <span>Redirecting...</span>
                </motion.div>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 text-primary-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
});
