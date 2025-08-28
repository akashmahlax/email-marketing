"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorPage({ error }: { error: Error }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">An unexpected error occurred.</p>
        <button onClick={() => router.refresh()} className="mt-4 px-4 py-2 bg-gray-200 rounded">Retry</button>
      </div>
    </div>
  );
}
