'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { EmailTemplate } from '@/lib/models/template';
import { SubscriberList } from '@/lib/models/subscriber';
import { Campaign } from '@/lib/models/campaign';

type EmailTemplateWithId = EmailTemplate & { _id: { toString: () => string } };
type SubscriberListWithId = SubscriberList & { _id: { toString: () => string } };
type CampaignWithId = Campaign & { _id: string };

const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject is required'),
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Invalid email address'),
  templateId: z.string().min(1, 'Template is required'),
  listIds: z.array(z.string()).min(1, 'At least one subscriber list is required'),
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
});

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [campaign, setCampaign] = useState<CampaignWithId | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateWithId[]>([]);
  const [lists, setLists] = useState<SubscriberListWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subject: '',
      fromName: '',
      fromEmail: '',
      templateId: '',
      listIds: [],
      trackOpens: true,
      trackClicks: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch campaign
        const campaignResponse = await fetch(`/api/campaigns/${id}`);
        if (!campaignResponse.ok) {
          throw new Error('Failed to fetch campaign');
        }
        const campaignData = await campaignResponse.json();
        setCampaign(campaignData);
        
        // Set form values
        form.reset({
          name: campaignData.name,
          subject: campaignData.subject,
          fromName: campaignData.fromName,
          fromEmail: campaignData.fromEmail,
          templateId: campaignData.templateId.toString(),
          listIds: campaignData.listIds.map((id: any) => id.toString()),
          trackOpens: campaignData.trackOpens,
          trackClicks: campaignData.trackClicks,
        });

        // Fetch templates
        const templatesResponse = await fetch('/api/templates');
        if (!templatesResponse.ok) {
          throw new Error('Failed to fetch templates');
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates);

        // Fetch subscriber lists
        const listsResponse = await fetch('/api/subscriber-lists');
        if (!listsResponse.ok) {
          throw new Error('Failed to fetch subscriber lists');
        }
        const listsData = await listsResponse.json();
        setLists(listsData.lists);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update campaign');
      }

      const updatedCampaign = await response.json();
      toast({
        title: 'Success',
        description: 'Campaign updated successfully',
      });

      // Redirect to campaign detail page
      router.push(`/campaigns/${id}`);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading campaign data...</p>
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

  // Check if campaign is editable
  const isEditable = ['draft', 'scheduled'].includes(campaign.status);
  const isTemplateEditable = campaign.status === 'draft';
  const areListsEditable = campaign.status === 'draft';

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
        <p className="text-muted-foreground">Update your campaign details</p>
      </div>

      {!isEditable && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <p>This campaign cannot be edited because it has already been sent or is currently sending.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Update the details for your campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Monthly Newsletter" 
                          {...field} 
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormDescription>
                        Internal name for your campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your May Newsletter" 
                          {...field} 
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormDescription>
                        Subject line recipients will see
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your Company" 
                          {...field} 
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormDescription>
                        Name that will appear in the from field
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="newsletter@yourcompany.com" 
                          {...field} 
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormDescription>
                        Email address that will appear in the from field
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isTemplateEditable}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.length === 0 ? (
                          <SelectItem value="" disabled>
                            No templates available
                          </SelectItem>
                        ) : (
                          templates.map((template) => (
                            <SelectItem
                              key={template._id.toString()}
                              value={template._id.toString()}
                            >
                              {template.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {!isTemplateEditable 
                        ? "Template cannot be changed after scheduling or sending" 
                        : "Select the template to use for this campaign"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Subscriber Lists</FormLabel>
                      <FormDescription>
                        {!areListsEditable 
                          ? "Subscriber lists cannot be changed after scheduling or sending" 
                          : "Select the subscriber lists to send this campaign to"}
                      </FormDescription>
                    </div>
                    {lists.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No subscriber lists available
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lists.map((list) => (
                          <FormField
                            key={list._id.toString()}
                            control={form.control}
                            name="listIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={list._id.toString()}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        list._id.toString()
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked && areListsEditable
                                          ? field.onChange([
                                              ...field.value,
                                              list._id.toString(),
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== list._id.toString()
                                              )
                                            );
                                      }}
                                      disabled={!areListsEditable}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-medium">
                                      {list.name}
                                    </FormLabel>
                                    <FormDescription>
                                      {list.subscriberCount || 0} subscribers
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="trackOpens"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Track Opens</FormLabel>
                        <FormDescription>
                          Track when recipients open your email
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackClicks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Track Clicks</FormLabel>
                        <FormDescription>
                          Track when recipients click links in your email
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !isEditable}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}