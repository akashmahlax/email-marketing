'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SubscriberList } from '@/lib/models/subscriber';

interface ImportSubscribersProps {
  onComplete?: () => void;
}

export default function ImportSubscribers({ onComplete }: ImportSubscribersProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [lists, setLists] = useState<SubscriberList[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0
  });

  // Fetch subscriber lists
  useState(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch('/api/subscriber-lists?limit=100');
        if (!response.ok) {
          throw new Error('Failed to fetch subscriber lists');
        }
        const data = await response.json();
        setLists(data.lists);
        setLoadingLists(false);
      } catch (err: any) {
        setError(err.message);
        setLoadingLists(false);
      }
    };
    
    fetchLists();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleListChange = (listId: string) => {
    setSelectedLists(prev => {
      if (prev.includes(listId)) {
        return prev.filter(id => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file to import');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setStats({
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lists', JSON.stringify(selectedLists));

      const response = await fetch('/api/subscribers/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import subscribers');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response');

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;

        // Try to parse the chunks as JSON to get progress updates
        try {
          const text = new TextDecoder().decode(value);
          const data = JSON.parse(text);
          
          if (data.progress) {
            setProgress(data.progress);
          }
          
          if (data.stats) {
            setStats(data.stats);
          }
        } catch (e) {
          // Not valid JSON yet, continue reading
        }
      }

      setSuccess(true);
      setLoading(false);
      
      if (onComplete) {
        onComplete();
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Subscribers</CardTitle>
        <CardDescription>
          Import subscribers from a CSV file. The file should have headers and include at least an email column.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Import Successful</AlertTitle>
            <AlertDescription>
              Successfully imported {stats.imported} subscribers.
              {stats.skipped > 0 && ` ${stats.skipped} were skipped (already exist).`}
              {stats.failed > 0 && ` ${stats.failed} failed to import.`}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="file">CSV File</Label>
          <Input 
            id="file" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            The CSV file should include headers. Required column: email. Optional columns: firstName, lastName, status.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Add to Lists (Optional)</Label>
          <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
            {loadingLists ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading lists...
              </div>
            ) : lists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No subscriber lists found.</p>
            ) : (
              <div className="space-y-2">
                {lists.map(list => (
                  <div key={list._id?.toString()} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`list-${list._id}`} 
                      checked={selectedLists.includes(list._id?.toString() || '')}
                      onCheckedChange={() => handleListChange(list._id?.toString() || '')}
                      disabled={loading}
                    />
                    <Label htmlFor={`list-${list._id}`} className="cursor-pointer">
                      {list.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importing subscribers...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <Progress value={progress * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processed: {stats.imported + stats.skipped + stats.failed}/{stats.total || '?'}</span>
              <span>
                {stats.imported} imported, {stats.skipped} skipped, {stats.failed} failed
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Subscribers
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}