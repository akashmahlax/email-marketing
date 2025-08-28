'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Search, Trash2, Edit, UserPlus } from 'lucide-react';
import { Subscriber } from '@/lib/models/subscriber';

interface ListSubscribersProps {
  listId: string;
  embedded?: boolean;
}

export default function ListSubscribers({ listId, embedded = false }: ListSubscribersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null);

  const fetchSubscribers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      let url = `/api/subscriber-lists/${listId}/subscribers?page=${page}&limit=${pagination.limit}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }
      
      const data = await response.json();
      setSubscribers(data.subscribers);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        pages: data.pagination.pages
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers(1, searchQuery);
  }, [listId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    fetchSubscribers(page, searchQuery);
  };

  const handleDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;
    
    try {
      const response = await fetch(`/api/subscriber-lists/${listId}/subscribers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriberId: subscriberToDelete._id }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscriber from list');
      }

      // Refresh the list
      fetchSubscribers(pagination.page, searchQuery);
      setSubscriberToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && subscribers.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-2">Error: {error}</p>
        <Button variant="outline" onClick={() => fetchSubscribers(1)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-4' : ''}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <Input
            placeholder="Search by email or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        {!embedded && (
          <Button onClick={() => router.push(`/subscribers/new?listId=${listId}`)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <p className="text-muted-foreground mb-4">No subscribers found in this list.</p>
          {!embedded && (
            <Button onClick={() => router.push(`/subscribers/new?listId=${listId}`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Subscriber
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber._id?.toString()}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>
                      {subscriber.firstName || subscriber.lastName ? 
                        `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={subscriber.status === 'active' ? 'default' : 
                                subscriber.status === 'unsubscribed' ? 'secondary' : 
                                'destructive'}
                      >
                        {subscriber.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!embedded ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.push(`/subscribers/${subscriber._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from list</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this subscriber from the list? 
                                  This will only remove them from this list, not delete the subscriber entirely.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    setSubscriberToDelete(subscriber);
                                    handleDeleteSubscriber();
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || 
                             page === pagination.pages || 
                             Math.abs(page - pagination.page) <= 1;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            isActive={page === pagination.page}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                      className={pagination.page >= pagination.pages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}