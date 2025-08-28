'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Edit, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SubscriberList } from '@/lib/models/subscriber';

interface SubscriberListWithStats extends SubscriberList {
  subscriberCount: number;
}

export default function SubscriberListPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [list, setList] = useState<SubscriberListWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/subscriber-lists/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscriber list');
        }
        
        const data = await response.json();
        setList(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchList();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p>{error || 'Subscriber list not found'}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => router.push('/subscriber-lists')}
          >
            Back to Lists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => router.push('/subscriber-lists')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex-1">{list.name}</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2" 
          onClick={() => router.push(`/subscriber-lists/${params.id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit List
        </Button>
      </div>

      {list.description && (
        <p className="text-muted-foreground mb-6">{list.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{list.subscriberCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-md font-medium">
              {new Date(list.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-md font-medium">
              {new Date(list.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscribers</h2>
        <Button onClick={() => router.push(`/subscribers/new?listId=${params.id}`)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Subscriber
        </Button>
      </div>

      <Separator className="mb-6" />

      <div className="mb-4">
        <iframe 
          src={`/api/subscriber-lists/${params.id}/subscribers?embed=true`} 
          className="w-full min-h-[500px] border rounded-md"
          title="Subscribers"
        />
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          variant="outline" 
          className="mr-2" 
          onClick={() => router.push('/subscriber-lists')}
        >
          Back to Lists
        </Button>
        <Button 
          variant="default" 
          onClick={() => router.push(`/subscribers/new?listId=${params.id}`)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Subscriber
        </Button>
      </div>
    </div>
  );
}