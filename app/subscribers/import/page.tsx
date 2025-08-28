"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ImportSubscribersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [listId, setListId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!file) {
      setError("Please choose a CSV file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (listId) formData.append("listId", listId);

      const res = await fetch(`/api/subscribers/import${listId ? `?listId=${listId}` : ""}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Import failed");
      }

      router.push("/subscribers");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Subscribers</CardTitle>
          <CardDescription>Upload a CSV with columns: email, firstName, lastName. Optionally attach to a list.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">CSV File</label>
              <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            {/* Optional: list selection - simple input to avoid fetching here */}
            <div>
              <label className="text-sm font-medium">Attach to List (optional)</label>
              <Input placeholder="Enter List ID" value={listId} onChange={(e) => setListId(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={isLoading}>{isLoading ? "Importing..." : "Import"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}