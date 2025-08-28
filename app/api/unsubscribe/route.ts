import { NextRequest, NextResponse } from "next/server";
import * as subscriberService from "@/lib/services/subscriber-service";

// Public endpoint - no authentication required
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    await subscriberService.unsubscribe(body.email, body.reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      // Don't reveal if email exists or not for security reasons
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}