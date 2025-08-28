'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Campaign, CampaignRecipient } from '@/lib/models/campaign';
import { formatDate } from '@/lib/utils';

type CampaignWithId = Campaign & { _id: string };
type CampaignRecipientWithId = CampaignRecipient & { _id: string };

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [campaign, setCampaign] = useState<CampaignWithId | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipientWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }
      const data = await response.json();
      setCampaign(data);
      
      // If campaign is scheduled, set the scheduled date
      if (data.scheduledAt) {
        setScheduledDate(new Date(data.scheduledAt));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecipients = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}/recipients`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipients');
      }
      const data = await response.json();
      setRecipients(data.recipients);
    } catch (err: any) {
      console.error('Error fetching recipients:', err);
    }
  };
  
  useEffect(() => {
    fetchCampaign();
    // Only fetch recipients if campaign is sent or sending
    if (campaign && ['sending', 'sent'].includes(campaign.status)) {
      fetchRecipients();
    }
  }, [id]);
  
  useEffect(() => {
    // Fetch recipients when campaign status changes to sent or sending
    if (campaign && ['sending', 'sent'].includes(campaign.status)) {
      fetchRecipients();
    }
  }, [campaign?.status]);
  
  const handleEdit = () => {
    router.push(`/campaigns/${id}/edit`);
  };
  
  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast({
        title: 'Error',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }
    
    setIsScheduling(true);
    try {
      const response = await fetch(`/api/campaigns/${id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduledAt: scheduledDate }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule campaign');
      }
      
      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      setIsScheduleOpen(false);
      
      toast({
        title: 'Success',
        description: 'Campaign scheduled successfully',
      });
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule campaign',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };
  
  const handleCancelSchedule = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/campaigns/${id}/schedule`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel campaign');
      }
      
      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      
      toast({
        title: 'Success',
        description: 'Campaign cancelled successfully',
      });
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel campaign',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/campaigns/${id}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }
      
      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      
      toast({
        title: 'Success',
        description: 'Campaign is being sent',
      });
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete campaign');
      }
      
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
      
      // Redirect to campaigns list
      router.push('/campaigns');
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
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
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }
  
  if (error || !campaign) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error || 'Campaign not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-muted-foreground mt-1">{campaign.subject}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
              <Popover open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsScheduleOpen(false)}
                      disabled={isScheduling}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSchedule}
                      disabled={!scheduledDate || isScheduling}
                    >
                      {isScheduling ? 'Scheduling...' : 'Schedule'}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Now'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately send the campaign to all subscribers in the selected lists.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendNow}>
                      Send Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {campaign.status === 'scheduled' && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isCancelling}>
                    {isCancelling ? 'Cancelling...' : 'Cancel Schedule'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Scheduled Campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the scheduled campaign. You can reschedule it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, Keep Scheduled</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSchedule}>
                      Yes, Cancel Schedule
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Now'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately send the campaign instead of waiting for the scheduled time.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendNow}>
                      Send Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {['draft', 'scheduled', 'cancelled'].includes(campaign.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this campaign. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!['sent', 'sending'].includes(campaign.status)}>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recipients" disabled={!['sent', 'sending'].includes(campaign.status)}>
            Recipients
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium">Status</dt>
                    <dd className="mt-1">{getStatusBadge(campaign.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">From</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">Created</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {formatDate(new Date(campaign.createdAt))}
                    </dd>
                  </div>
                  {campaign.scheduledAt && (
                    <div>
                      <dt className="text-sm font-medium">Scheduled For</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {formatDate(new Date(campaign.scheduledAt))}
                      </dd>
                    </div>
                  )}
                  {campaign.sentAt && (
                    <div>
                      <dt className="text-sm font-medium">Sent</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {formatDate(new Date(campaign.sentAt))}
                      </dd>
                    </div>
                  )}
                  {campaign.completedAt && (
                    <div>
                      <dt className="text-sm font-medium">Completed</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {formatDate(new Date(campaign.completedAt))}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium">Track Opens</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {campaign.trackOpens ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">Track Clicks</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {campaign.trackClicks ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.analytics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.sent}</p>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.uniqueOpens}</p>
                    <p className="text-sm text-muted-foreground">Unique Opens</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.uniqueClicks}</p>
                    <p className="text-sm text-muted-foreground">Unique Clicks</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.openRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.clickRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{campaign.analytics.clickToOpenRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Click-to-Open Rate</p>
                  </div>
                </div>
              ) : (
                <p>No analytics data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Recipients</CardTitle>
              <CardDescription>
                List of subscribers who received this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipients.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Email</th>
                        <th className="p-2 text-left font-medium">Status</th>
                        <th className="p-2 text-left font-medium">Sent</th>
                        <th className="p-2 text-left font-medium">Opened</th>
                        <th className="p-2 text-left font-medium">Clicked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((recipient) => (
                        <tr key={recipient._id} className="border-b">
                          <td className="p-2">{recipient.email}</td>
                          <td className="p-2">
                            <Badge variant={recipient.status === 'queued' ? 'outline' : 
                                          recipient.status === 'sent' ? 'secondary' :
                                          recipient.status === 'opened' ? 'default' :
                                          recipient.status === 'clicked' ? 'success' : 'outline'}>
                              {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {recipient.sentAt ? formatDate(new Date(recipient.sentAt)) : '-'}
                          </td>
                          <td className="p-2">
                            {recipient.openedAt ? formatDate(new Date(recipient.openedAt)) : '-'}
                          </td>
                          <td className="p-2">
                            {recipient.clickedAt ? formatDate(new Date(recipient.clickedAt)) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No recipient data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}