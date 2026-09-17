'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      try {
        await login(data.email, data.password);

        if (rememberMe) {
          localStorage.setItem('remembered_email', data.email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        toast.success('Login successful', {
          description: `Welcome back`,
        });

        router.push('/dashboard');
      } catch (error) {
        toast.error('Login failed', {
          description: 'Invalid email or password. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [login, rememberMe, router]
  );

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    showPassword,
    togglePassword,
    isLoading,
    rememberMe,
    setRememberMe,
  };
}
