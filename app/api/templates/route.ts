import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as templateService from "@/lib/services/template-service";

export async function GET(request: NextRequest) {
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
    const category = searchParams.get("category");
    const isArchived = searchParams.get("archived") === "true";
    
    // Build filter
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    filter.isArchived = isArchived;
    
    const result = await templateService.getTemplates(page, limit, filter);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.subject || !body.content) {
      return NextResponse.json({ error: "Name, subject, and content are required" }, { status: 400 });
    }
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const template = await templateService.createTemplate(body, userId);
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}