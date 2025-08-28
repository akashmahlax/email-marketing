"use client";

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign out</h2>
        <Button onClick={() => signOut({ callbackUrl: '/' })} className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
}
