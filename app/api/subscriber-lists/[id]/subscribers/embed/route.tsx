import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import ListSubscribers from '@/components/email/list-subscribers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Render the embedded component
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Subscribers</title>
        <link rel="stylesheet" href="/globals.css">
      </head>
      <body>
        <div id="root">
          <ListSubscribers listId="${params.id}" embedded={true} />
        </div>
      </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}