"use client";

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // Always send authenticated users to dashboard regardless of callbackUrl
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign in</h2>
        <Button onClick={() => signIn('google')} className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
