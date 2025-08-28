"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const subscriberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  addToLists: z.array(z.string()).optional(),
});

type SubscriberFormValues = z.infer<typeof subscriberSchema>;

export default function NewSubscriberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriberLists, setSubscriberLists] = useState<{id: string, name: string}[]>([]);

  // Fetch subscriber lists
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

  const form = useForm<SubscriberFormValues>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      addToLists: [],
    },
  });

  const onSubmit = async (values: SubscriberFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add subscriber");
      }

      // Redirect to subscribers list on success
      router.push("/subscribers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Subscriber</CardTitle>
          <CardDescription>
            Add a new subscriber to your email marketing lists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="subscriber@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {subscriberLists.length > 0 && (
                <div className="space-y-4">
                  <FormLabel>Add to Lists</FormLabel>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {subscriberLists.map((list) => (
                      <FormField
                        key={list.id}
                        control={form.control}
                        name="addToLists"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={list.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(list.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value || [], list.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== list.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="cursor-pointer">
                                  {list.name}
                                </FormLabel>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <CardFooter className="flex justify-between px-0">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => router.push("/subscribers")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Subscriber"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}