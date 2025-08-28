import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import TemplateList from "@/components/email/template-list";

export const metadata: Metadata = {
  title: "Email Templates",
  description: "Manage your email templates",
};

export default function TemplatesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your email templates for campaigns.
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>
      
      <TemplateList />
    </div>
  );
}