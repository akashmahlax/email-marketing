"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ObjectId } from "mongodb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomPagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Subscriber } from "@/lib/models/subscriber";
import { MoreHorizontal, Search, Edit, Trash, Tag } from "lucide-react";

export default function SubscriberList() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subscriberLists, setSubscriberLists] = useState<{id: string, name: string}[]>([]);
  const [stats, setStats] = useState<{total: number, active: number, unsubscribed: number}>({total: 0, active: 0, unsubscribed: 0});

  // Fetch subscribers
  useEffect(() => {
    const fetchSubscribers = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", "10");
        
        if (searchQuery) {
          queryParams.append("search", searchQuery);
        }
        
        if (listFilter && listFilter !== "all") {
          queryParams.append("list", listFilter);
        }
        
        const response = await fetch(`/api/subscribers?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch subscribers");
        }
        
        const data = await response.json();
        setSubscribers(data.subscribers);
        setTotalPages(Math.ceil(data.total / 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscribers();
  }, [page, searchQuery, listFilter]);

  // Fetch subscriber lists for filter
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch("/api/subscriber-lists");
        
        if (!response.ok) {
          throw new Error("Failed to fetch subscriber lists");
        }
        
        const data = await response.json();
        setSubscriberLists(data.lists);
      } catch (err) {
        console.error("Error fetching subscriber lists:", err);
      }
    };

    fetchLists();
  }, []);

  // Fetch subscriber stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/subscribers?stats=true");
        
        if (!response.ok) {
          throw new Error("Failed to fetch subscriber stats");
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching subscriber stats:", err);
      }
    };

    fetchStats();
  }, []);

  const handleDelete = async (id: string | ObjectId | undefined) => {
    if (!id) return;
    
    const idString = id.toString();
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    
    try {
      const response = await fetch(`/api/subscribers/${idString}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete subscriber");
      }
      
      // Remove the deleted subscriber from the list
      setSubscribers(subscribers.filter(subscriber => subscriber._id?.toString() !== idString));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        active: prev.active - 1 // Assuming we're deleting an active subscriber
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading subscribers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">Total Subscribers</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">Active Subscribers</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">Unsubscribed</p>
              <p className="text-2xl font-bold">{stats.unsubscribed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={listFilter}
          onValueChange={setListFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Lists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lists</SelectItem>
            {subscriberLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No subscribers found. Add your first subscriber to get started.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((subscriber) => (
                  <TableRow key={subscriber._id?.toString()}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.firstName} {subscriber.lastName}</TableCell>
                    <TableCell>
                      {subscriber.status === "unsubscribed" ? (
                        <Badge variant="destructive">Unsubscribed</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(subscriber.createdAt.toString())}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/subscribers/${subscriber._id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/subscribers/${subscriber._id}/lists`}>
                              <Tag className="mr-2 h-4 w-4" />
                              Manage Lists
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(subscriber._id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <CustomPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}