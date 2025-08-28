import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as subscriberService from "@/lib/services/subscriber-service";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const result = await subscriberService.getSubscribersByList(params.id, page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.subscriberId) {
      return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
    }
    
    const result = await subscriberService.addSubscriberToList(params.id, body.subscriberId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.subscriberId) {
      return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
    }
    
    const result = await subscriberService.removeSubscriberFromList(params.id, body.subscriberId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}