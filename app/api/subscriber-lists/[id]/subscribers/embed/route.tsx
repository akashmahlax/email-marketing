import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as subscriberService from '@/lib/services/subscriber-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await context.params;
    const { subscribers } = await subscriberService.getSubscribersByList(params.id, 1, 1000);

    const rows = subscribers.map(s => `<tr><td>${s.email}</td><td>${s.firstName || ''} ${s.lastName || ''}</td><td>${s.status}</td></tr>`).join('');

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Subscribers</title>
        <style>table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}</style>
      </head>
      <body>
        <h3>Subscribers</h3>
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Status</th></tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>`;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}