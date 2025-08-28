"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/lib/models/template";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Email subject is required"),
  preheader: z.string().optional(),
  content: z.string().min(1, "Email content is required"),
  category: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  template?: Partial<EmailTemplate>;
  onSave: (template: TemplateFormValues) => Promise<void>;
  isLoading?: boolean;
}

export default function TemplateEditor({ template, onSave, isLoading = false }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      subject: template?.subject || "",
      preheader: template?.preheader || "",
      content: template?.content || "",
      category: template?.category || "",
    },
  });

  // Watch content for preview
  const content = form.watch("content");
  const subject = form.watch("subject");

  // Update preview when content changes
  useEffect(() => {
    // Simple HTML preview - in a real app, you'd process variables and formatting
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${subject}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1, h2, h3 { color: #2c3e50; }
          .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        ${content}
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p><a href="#unsubscribe">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `;
    setPreviewHtml(html);
  }, [content, subject]);

  const onSubmit = async (values: TemplateFormValues) => {
    try {
      await onSave(values);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Template</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                  <CardDescription>
                    Create or edit your email template. Use variables like {'{name}'} for personalization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Welcome Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Marketing" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="A brief description of this template" 
                            className="resize-none" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
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
                          <Input placeholder="Welcome to our service!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preheader"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preheader Text</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="The text that appears after the subject in email clients" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="<h1>Welcome, {name}!</h1><p>We're excited to have you on board.</p>" 
                            className="min-h-[300px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Template"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                This is how your email will look to recipients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-white">
                <div className="mb-4 p-2 bg-gray-100 rounded">
                  <strong>Subject:</strong> {subject}
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full min-h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab("edit")}>Back to Editor</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}