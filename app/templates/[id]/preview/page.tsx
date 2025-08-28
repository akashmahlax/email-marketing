"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/lib/models/template";
import { ArrowLeft, Edit } from "lucide-react";

export default function TemplatePreviewPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  // Fetch template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch template");
        }
        
        const data = await response.json();
        setTemplate(data);

        // Generate preview HTML
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${data.subject}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #2c3e50; }
              .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            ${data.content}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
              <p><a href="#unsubscribe">Unsubscribe</a></p>
            </div>
          </body>
          </html>
        `;
        setPreviewHtml(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-64">
              <p>Loading template preview...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">{error || "Template not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <Link href={`/templates/${params.id}/edit`} className="ml-auto">
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>
            {template.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-white">
            <div className="mb-4 p-2 bg-gray-100 rounded">
              <div><strong>Subject:</strong> {template.subject}</div>
              {template.preheader && (
                <div className="mt-2"><strong>Preheader:</strong> {template.preheader}</div>
              )}
            </div>
            <iframe
              srcDoc={previewHtml}
              title="Email Preview"
              className="w-full min-h-[500px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(template.updatedAt).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">
            Category: {template.category || "Uncategorized"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}