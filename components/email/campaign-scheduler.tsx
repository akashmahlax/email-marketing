'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Campaign } from '@/lib/models/campaign';

type CampaignWithId = Campaign & { _id: string };

type CampaignSchedulerProps = {
  campaign: CampaignWithId;
  onScheduled?: () => void;
};

export function CampaignScheduler({ campaign, onScheduled }: CampaignSchedulerProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(campaign.scheduledAt ? new Date(campaign.scheduledAt) : undefined);
  const [time, setTime] = useState<string>(campaign.scheduledAt ? format(new Date(campaign.scheduledAt), 'HH:mm') : '12:00');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSchedule = async () => {
    if (!date) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Validate that the scheduled date is in the future
    if (scheduledDate <= new Date()) {
      toast({
        title: 'Error',
        description: 'Scheduled time must be in the future',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign._id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledAt: scheduledDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule campaign');
      }

      toast({
        title: 'Success',
        description: `Campaign scheduled for ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}`,
      });

      // Close popover
      setOpen(false);

      // Call onScheduled callback if provided
      if (onScheduled) {
        onScheduled();
      }

      // Refresh the page
      router.refresh();
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign._id}/schedule`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel scheduled campaign');
      }

      toast({
        title: 'Success',
        description: 'Campaign schedule cancelled',
      });

      // Reset date and time
      setDate(undefined);
      setTime('12:00');

      // Call onScheduled callback if provided
      if (onScheduled) {
        onScheduled();
      }

      // Refresh the page
      router.refresh();
    } catch (error: any) {
      console.error('Error cancelling campaign schedule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel scheduled campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if campaign is already scheduled
  const isScheduled = campaign.status === 'scheduled';

  // Check if campaign can be scheduled (only draft campaigns can be scheduled)
  const canBeScheduled = campaign.status === 'draft';

  if (!canBeScheduled && !isScheduled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Campaign</CardTitle>
          <CardDescription>
            This campaign cannot be scheduled because it has already been sent or is currently sending.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Campaign</CardTitle>
        <CardDescription>
          {isScheduled
            ? `This campaign is scheduled to send on ${format(new Date(campaign.scheduledAt!), 'PPP')} at ${format(
                new Date(campaign.scheduledAt!),
                'p'
              )}`
            : 'Choose when to send this campaign'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isScheduled ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {format(new Date(campaign.scheduledAt!), 'PPP')}
              </p>
              <p className="text-xl">
                {format(new Date(campaign.scheduledAt!), 'p')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="w-full sm:w-[240px]">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full sm:w-[150px]">
                  <div className="flex items-center">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isScheduled ? (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Schedule'
            )}
          </Button>
        ) : (
          <div className="flex w-full justify-end">
            <Button
              onClick={handleSchedule}
              disabled={!date || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Campaign'
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}