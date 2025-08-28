"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, FileText, BarChart3, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalCampaigns: number;
  totalSubscribers: number;
  totalTemplates: number;
  totalLists: number;
  recentCampaigns: Array<{
    _id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalSubscribers: 0,
    totalTemplates: 0,
    totalLists: 0,
    recentCampaigns: []
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Fetch dashboard stats
    fetchDashboardStats();
  }, [session, status, router]);

  const fetchDashboardStats = async () => {
    try {
      const [campaignsRes, subscribersRes, templatesRes, listsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/subscribers'),
        fetch('/api/templates'),
        fetch('/api/subscriber-lists')
      ]);

      const campaignsData = await campaignsRes.json();
      const subscribersData = await subscribersRes.json();
      const templatesData = await templatesRes.json();
      const listsData = await listsRes.json();

      // Handle different response formats from APIs
      const campaignsArray = Array.isArray(campaignsData) ? campaignsData : 
                           (campaignsData?.campaigns && Array.isArray(campaignsData.campaigns)) ? campaignsData.campaigns : [];
      const subscribersArray = Array.isArray(subscribersData) ? subscribersData : 
                             (subscribersData?.subscribers && Array.isArray(subscribersData.subscribers)) ? subscribersData.subscribers : [];
      const templatesArray = Array.isArray(templatesData) ? templatesData : 
                           (templatesData?.templates && Array.isArray(templatesData.templates)) ? templatesData.templates : [];
      const listsArray = Array.isArray(listsData) ? listsData : 
                        (listsData?.lists && Array.isArray(listsData.lists)) ? listsData.lists : [];

      setStats({
        totalCampaigns: campaignsArray.length,
        totalSubscribers: subscribersArray.length,
        totalTemplates: templatesArray.length,
        totalLists: listsArray.length,
        recentCampaigns: campaignsArray.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setStats({
        totalCampaigns: 0,
        totalSubscribers: 0,
        totalTemplates: 0,
        totalLists: 0,
        recentCampaigns: []
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign in
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'sending':
        return <Badge variant="default">Sending</Badge>;
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your email campaigns today.
          </p>
        </div>
        <Link href="/campaigns/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Active email campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              Email subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Reusable templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriber Lists</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLists}</div>
            <p className="text-xs text-muted-foreground">
              Organized lists
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Your latest email campaigns and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email campaign to get started.
              </p>
              <Link href="/campaigns/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentCampaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(campaign.status)}
                    <Link href={`/campaigns/${campaign._id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Create Campaign
            </CardTitle>
            <CardDescription>
              Start a new email campaign with your subscribers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns/create">
              <Button className="w-full">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Manage Subscribers
            </CardTitle>
            <CardDescription>
              Add, edit, and organize your email subscribers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/subscribers">
              <Button className="w-full" variant="outline">
                View Subscribers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Create and manage reusable email templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/templates">
              <Button className="w-full" variant="outline">
                View Templates
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
