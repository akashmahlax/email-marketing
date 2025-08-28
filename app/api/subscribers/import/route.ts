import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as subscriberService from '@/lib/services/subscriber-service';
import { parse } from 'csv-parse';

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const listsJson = formData.get('lists') as string;
    const lists = listsJson ? JSON.parse(listsJson) : [];
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });
    }
    
    // Read file content
    const fileContent = await file.text();
    
    // Parse CSV
    const records = await new Promise<any[]>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no valid data' }, { status: 400 });
    }
    
    // Validate required fields
    for (const record of records) {
      if (!record.email) {
        return NextResponse.json({ 
          error: 'CSV file must contain an "email" column with values for all rows' 
        }, { status: 400 });
      }
    }
    
    // Create a stream to send progress updates
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Start the import process in the background
    const importProcess = async () => {
      const stats = {
        total: records.length,
        imported: 0,
        skipped: 0,
        failed: 0
      };
      
      // Send initial stats
      writer.write(encoder.encode(JSON.stringify({
        progress: 0,
        stats
      })));
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Check if subscriber already exists
          const existingSubscriber = await subscriberService.getSubscriberByEmail(record.email);
          
          if (existingSubscriber) {
            // Subscriber exists, add to lists if specified
            if (lists.length > 0) {
              for (const listId of lists) {
                try {
                  await subscriberService.addSubscriberToList(existingSubscriber._id.toString(), listId);
                } catch (err) {
                  // Ignore errors for list additions
                }
              }
            }
            stats.skipped++;
          } else {
            // Create new subscriber
            const newSubscriber = await subscriberService.createSubscriber({
              email: record.email,
              firstName: record.firstName || '',
              lastName: record.lastName || '',
              status: record.status || 'active'
            });
            
            // Add to lists if specified
            if (lists.length > 0 && newSubscriber._id) {
              for (const listId of lists) {
                try {
                  await subscriberService.addSubscriberToList(newSubscriber._id.toString(), listId);
                } catch (err) {
                  // Ignore errors for list additions
                }
              }
            }
            
            stats.imported++;
          }
        } catch (err) {
          stats.failed++;
        }
        
        // Send progress update every 5% or for every record if small import
        if (i % Math.max(1, Math.floor(records.length / 20)) === 0 || i === records.length - 1) {
          writer.write(encoder.encode(JSON.stringify({
            progress: (i + 1) / records.length,
            stats
          })));
        }
      }
      
      // Send final update
      writer.write(encoder.encode(JSON.stringify({
        progress: 1,
        stats,
        completed: true
      })));
      
      writer.close();
    };
    
    // Start the import process without awaiting it
    importProcess().catch(error => {
      console.error('Import process error:', error);
      writer.write(encoder.encode(JSON.stringify({ error: error.message })));
      writer.close();
    });
    
    // Return the stream as the response
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper for encoding text
const encoder = new TextEncoder();