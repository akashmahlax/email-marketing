'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomPagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import { Campaign } from '@/lib/models/campaign';

type CampaignWithId = Campaign & { _id: string };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/campaigns?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setPage(1);
  };

  const handleCreateCampaign = () => {
    window.location.href = '/campaigns/create';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'sending':
        return <Badge variant="default">Sending</Badge>;
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your email campaigns and track their performance.
          </p>
        </div>
        <Button onClick={handleCreateCampaign}>
          Create Campaign
        </Button>
      </div>

      <div className="flex gap-2">
        <Button 
          variant={statusFilter === "draft" ? "default" : "outline"} 
          onClick={() => handleFilterChange("draft")}
        >
          Draft
        </Button>
        <Button 
          variant={statusFilter === "scheduled" ? "default" : "outline"} 
          onClick={() => handleFilterChange("scheduled")}
        >
          Scheduled
        </Button>
        <Button 
          variant={statusFilter === "sending" ? "default" : "outline"} 
          onClick={() => handleFilterChange("sending")}
        >
          Sending
        </Button>
        <Button 
          variant={statusFilter === "sent" ? "default" : "outline"} 
          onClick={() => handleFilterChange("sent")}
        >
          Sent
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading campaigns...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter 
              ? `You don't have any ${statusFilter} campaigns yet.` 
              : "You haven't created any campaigns yet."}
          </p>
          <Button onClick={handleCreateCampaign}>Create Your First Campaign</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Link 
              href={`/campaigns/${campaign._id}`} 
              key={campaign._id}
              className="block hover:no-underline"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.subject}
                      </CardDescription>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">From</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {campaign.status === 'scheduled' ? 'Scheduled for' : 
                         campaign.status === 'sent' ? 'Sent on' : 
                         'Created on'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.status === 'scheduled' && campaign.scheduledAt 
                          ? formatDate(new Date(campaign.scheduledAt)) 
                          : campaign.status === 'sent' && campaign.sentAt 
                          ? formatDate(new Date(campaign.sentAt))
                          : formatDate(new Date(campaign.createdAt))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.status === 'sent' 
                          ? `${campaign.analytics?.uniqueOpens || 0} opens · ${campaign.analytics?.uniqueClicks || 0} clicks` 
                          : 'Not available yet'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <CustomPagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        </div>
      )}
    </div>
  );
}