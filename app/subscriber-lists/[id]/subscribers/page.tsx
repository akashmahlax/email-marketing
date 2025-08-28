"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CustomPagination } from "@/components/ui/pagination";
import { ArrowLeft, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { Subscriber } from "@/lib/models/subscriber";
import { SubscriberList } from "@/lib/models/subscriber";
import { formatDate } from "@/lib/utils";

export default function ListSubscribersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [list, setList] = useState<SubscriberList | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch list and subscribers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch list details
        const listResponse = await fetch(`/api/subscriber-lists/${params.id}`);
        if (!listResponse.ok) {
          throw new Error("Failed to fetch list");
        }
        const listData = await listResponse.json();
        setList(listData);

        // Fetch subscribers
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", "10");
        
        if (searchQuery) {
          queryParams.append("search", searchQuery);
        }
        
        const subscribersResponse = await fetch(`/api/subscriber-lists/${params.id}/subscribers?${queryParams.toString()}`);
        if (!subscribersResponse.ok) {
          throw new Error("Failed to fetch subscribers");
        }
        
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData.subscribers);
        setTotalPages(Math.ceil(subscribersData.pagination.total / 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, page, searchQuery]);

  const handleRemoveSubscriber = async (subscriberId: string) => {
    try {
      const response = await fetch(`/api/subscriber-lists/${params.id}/subscribers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriberId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove subscriber");
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove subscriber");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500">List not found</p>
              <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
            <p className="text-muted-foreground mt-1">
              {list.description || "Manage subscribers in this list"}
            </p>
          </div>
        </div>
        <Link href={`/subscriber-lists/${params.id}/add-subscribers`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscribers
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{list.subscriberCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>
            {subscribers.length} of {list.subscriberCount || 0} subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No subscribers yet</h3>
              <p className="text-muted-foreground mb-4">
                Add subscribers to this list to get started.
              </p>
              <Link href={`/subscriber-lists/${params.id}/add-subscribers`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscribers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber._id?.toString()}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{subscriber.email}</h4>
                      <p className="text-sm text-muted-foreground">
                        {subscriber.firstName} {subscriber.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={subscriber.status === "active" ? "default" : "destructive"}>
                      {subscriber.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(subscriber.createdAt)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSubscriber(subscriber._id?.toString() || "")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
