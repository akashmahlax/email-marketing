'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Campaign } from '@/lib/models/campaign';

type CampaignWithId = Campaign & { _id: string };

type CampaignSenderProps = {
  campaign: CampaignWithId;
  onSent?: () => void;
};

export function CampaignSender({ campaign, onSent }: CampaignSenderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign._id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }

      toast({
        title: 'Success',
        description: 'Campaign is now being sent',
      });

      // Close dialog
      setDialogOpen(false);

      // Call onSent callback if provided
      if (onSent) {
        onSent();
      }

      // Refresh the page
      router.refresh();
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if campaign can be sent (only draft or scheduled campaigns can be sent)
  const canBeSent = ['draft', 'scheduled'].includes(campaign.status);

  if (!canBeSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Send Campaign</CardTitle>
          <CardDescription>
            This campaign cannot be sent because it has already been sent or is currently sending.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Campaign</CardTitle>
        <CardDescription>
          Send this campaign immediately to all recipients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This will immediately send your campaign to all recipients in the selected subscriber lists. 
          This action cannot be undone.
        </p>
      </CardContent>
      <CardFooter>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send Now
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately send your campaign "{campaign.name}" to all recipients in the selected subscriber lists.
                <br /><br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Yes, Send Now'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}