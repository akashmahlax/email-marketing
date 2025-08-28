'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Campaign } from '@/lib/models/campaign';

type CampaignWithId = Campaign & { _id: string };

type Recipient = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
};

type CampaignRecipientsProps = {
  campaign: CampaignWithId;
  refreshInterval?: number; // in milliseconds
};

export function CampaignRecipients({ campaign, refreshInterval = 30000 }: CampaignRecipientsProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const pageSize = 10;

  const fetchRecipients = async () => {
    if (!campaign._id) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/campaigns/${campaign._id}/recipients?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign recipients');
      }
      
      const data = await response.json();
      setRecipients(data.recipients);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (err: any) {
      console.error('Error fetching recipients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    
    // Set up refresh interval if campaign is in progress
    if (['sending', 'sent'].includes(campaign.status)) {
      const interval = setInterval(fetchRecipients, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [campaign._id, campaign.status, page, statusFilter, refreshInterval]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'delivered':
        return 'default';
      case 'opened':
        return 'success';
      case 'clicked':
        return 'success';
      case 'bounced':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getRecipientName = (recipient: Recipient) => {
    if (recipient.firstName && recipient.lastName) {
      return `${recipient.firstName} ${recipient.lastName}`;
    } else if (recipient.firstName) {
      return recipient.firstName;
    } else if (recipient.lastName) {
      return recipient.lastName;
    } else {
      return '-';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading recipients: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Campaign Recipients</CardTitle>
            <CardDescription>
              View the status of your campaign recipients
            </CardDescription>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && recipients.length === 0 ? (
          <div className="text-center py-8">
            <p>Loading recipients...</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-8">
            <p>No recipients found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient._id}>
                      <TableCell className="font-medium">{recipient.email}</TableCell>
                      <TableCell>{getRecipientName(recipient)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(recipient.status)}>
                          {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(recipient.sentAt)}</TableCell>
                      <TableCell>
                        {recipient.openedAt && (
                          <span className="text-xs text-muted-foreground block">
                            Opened: {formatDate(recipient.openedAt)}
                          </span>
                        )}
                        {recipient.clickedAt && (
                          <span className="text-xs text-muted-foreground block">
                            Clicked: {formatDate(recipient.clickedAt)}
                          </span>
                        )}
                        {recipient.error && (
                          <span className="text-xs text-red-500 block">
                            Error: {recipient.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
            
            {loading && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Refreshing recipient data...</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}