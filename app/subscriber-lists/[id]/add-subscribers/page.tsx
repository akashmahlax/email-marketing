"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomPagination } from "@/components/ui/pagination";
import { ArrowLeft, Plus, Search } from "lucide-react";

interface SubscriberLite {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
}

export default function AddSubscribersToListPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subscribers, setSubscribers] = useState<SubscriberLite[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all subscribers (paginated). For simplicity we reuse /api/subscribers and filter client-side.
  useEffect(() => {
    const getIdString = (value: any): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (typeof value === "object" && typeof value.$oid === "string") return value.$oid;
      const maybe = value.toString?.();
      // Guard against "[object Object]"
      if (maybe && maybe !== "[object Object]") return maybe;
      return "";
    };

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: page.toString(), limit: "10" });
        const res = await fetch(`/api/subscribers?${qs.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch subscribers");
        const data = await res.json();

        // API returns { subscribers, pagination }
        const list = Array.isArray(data) ? data : data.subscribers ?? [];
        const pages = Array.isArray(data) ? 1 : data.pagination?.pages ?? 1;
        setSubscribers(
          list.map((s: any) => ({
            _id: getIdString(s._id),
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName,
            status: s.status,
          }))
        );
        setTotalPages(pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const filtered = useMemo(() => {
    if (!search) return subscribers;
    const q = search.toLowerCase();
    return subscribers.filter(
      (s) => s.email.toLowerCase().includes(q) || `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase().includes(q)
    );
  }, [search, subscribers]);

  const toggle = (id: string, checked: boolean | string) => {
    setSelected((prev) => ({ ...prev, [id]: checked === true }));
  };

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      // POST one by one; API accepts single subscriberId
      for (const id of selectedIds) {
        const res = await fetch(`/api/subscriber-lists/${params.id}/subscribers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriberId: id }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to add subscriber to list");
        }
      }
      router.push(`/subscriber-lists/${params.id}/subscribers`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Subscribers</h1>
            <p className="text-muted-foreground">Search and select existing subscribers to add to this list.</p>
          </div>
        </div>
        <Link href={`/subscriber-lists/${params.id}/subscribers`}>
          <Button variant="ghost">View List</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Subscribers</CardTitle>
          <CardDescription>Choose one or more subscribers, then click Add.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading subscribers...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">No subscribers found.</div>
            ) : (
              filtered.map((s) => (
                <label key={s._id} className="flex items-center gap-3 rounded border p-3">
                  <Checkbox checked={!!selected[s._id]} onCheckedChange={(c) => toggle(s._id, c)} />
                  <div className="flex-1">
                    <div className="font-medium">{s.email}</div>
                    <div className="text-xs text-muted-foreground">{s.firstName} {s.lastName}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Selected: {selectedIds.length}</div>
            <Button onClick={handleAdd} disabled={isLoading || selectedIds.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Add to List
            </Button>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <CustomPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
