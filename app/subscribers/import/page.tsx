'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ImportSubscribers from '@/components/email/import-subscribers';

export default function ImportSubscribersPage() {
  const router = useRouter();

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => router.push('/subscribers')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Subscribers
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Import Subscribers</h1>
      </div>
      
      <ImportSubscribers 
        onComplete={() => router.push('/subscribers')}
      />
    </div>
  );
}