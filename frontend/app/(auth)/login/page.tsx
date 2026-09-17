'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BrandingSection } from './components/branding-section';
import { LoginCard } from './components/login-card';
import { LoginFooter } from './components/login-footer';
import { useAuthStore } from '@/store';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().then(() => setMounted(true));
  }, [fetchUser]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between selection:bg-[#ED1C24]/20 selection:text-[#ED1C24] relative overflow-hidden">
      {/* Background Mesh Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#ED1C24]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#ED1C24]/3 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Layout Container */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-8 my-auto">
        <div className="w-full max-w-[1280px] flex items-center justify-center lg:justify-between gap-8 lg:gap-12 flex-wrap lg:flex-nowrap">
          {/* Left Branding Showcase (55% Width, Max 720px) */}
          <BrandingSection />

          {/* Right Login Column */}
          <div className="flex flex-col items-center justify-center w-full lg:w-[45%] max-w-[520px] mx-auto py-6">
            <LoginCard />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-[520px]"
            >
              <LoginFooter />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
