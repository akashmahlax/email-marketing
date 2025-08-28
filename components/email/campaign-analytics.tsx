'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Campaign } from '@/lib/models/campaign';

type CampaignWithId = Campaign & { _id: string };

type CampaignAnalyticsProps = {
  campaign: CampaignWithId;
  refreshInterval?: number; // in milliseconds
};

type AnalyticsData = {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
};

export function CampaignAnalytics({ campaign, refreshInterval = 30000 }: CampaignAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sent: campaign.sentCount || 0,
    delivered: campaign.deliveredCount || 0,
    opens: campaign.openCount || 0,
    clicks: campaign.clickCount || 0,
    openRate: 0,
    clickRate: 0,
    clickToOpenRate: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!campaign._id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign analytics');
      }
      
      const data = await response.json();
      
      // Calculate rates
      const delivered = data.deliveredCount || 0;
      const opens = data.openCount || 0;
      const clicks = data.clickCount || 0;
      
      const openRate = delivered > 0 ? (opens / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicks / delivered) * 100 : 0;
      const clickToOpenRate = opens > 0 ? (clicks / opens) * 100 : 0;
      
      setAnalytics({
        sent: data.sentCount || 0,
        delivered,
        opens,
        clicks,
        openRate,
        clickRate,
        clickToOpenRate,
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up refresh interval if campaign is in progress
    if (['sending', 'sent'].includes(campaign.status)) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [campaign._id, campaign.status, refreshInterval]);

  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%';
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading analytics: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>
          Track how your campaign is performing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Open Rate</p>
                <div className="flex items-center justify-between">
                  <Progress value={analytics.openRate} className="h-2" />
                  <span className="text-sm font-medium ml-2">
                    {formatPercent(analytics.openRate)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Click Rate</p>
                <div className="flex items-center justify-between">
                  <Progress value={analytics.clickRate} className="h-2" />
                  <span className="text-sm font-medium ml-2">
                    {formatPercent(analytics.clickRate)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.sent)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Emails Delivered</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.delivered)}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Emails Sent</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.sent)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Emails Delivered</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.delivered)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercent(analytics.sent > 0 ? (analytics.delivered / analytics.sent) * 100 : 0)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Opens</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.opens)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Clicks</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.clicks)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Click-to-Open Rate</p>
                  <p className="text-2xl font-bold">{formatPercent(analytics.clickToOpenRate)}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {loading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Refreshing analytics data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}