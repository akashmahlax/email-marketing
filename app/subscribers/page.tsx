import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import SubscriberList from "@/components/email/subscriber-list";

export const metadata: Metadata = {
  title: "Email Subscribers",
  description: "Manage your email subscribers",
};

export default function SubscribersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your email subscribers and lists.
          </p>
        </div>
        <Link href="/subscribers/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subscriber
          </Button>
        </Link>
      </div>
      
      <SubscriberList />
    </div>
  );
}