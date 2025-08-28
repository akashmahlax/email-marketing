import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import SubscriberListsManager from "@/components/email/subscriber-lists-manager";

export const metadata: Metadata = {
  title: "Subscriber Lists",
  description: "Manage your subscriber lists",
};

export default function SubscriberListsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriber Lists</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage lists to organize your subscribers.
          </p>
        </div>
        <Link href="/subscriber-lists/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New List
          </Button>
        </Link>
      </div>
      
      <SubscriberListsManager />
    </div>
  );
}