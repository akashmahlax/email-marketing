import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import client from '@/lib/db';
import { Campaign } from '@/lib/models/campaign';
import * as campaignService from "@/lib/services/campaign-service";
import { ObjectId } from "mongodb";

/**
 * GET /api/campaigns
 * Get all campaigns with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Get campaigns
    const result = await campaignService.getCampaigns(page, limit, filter);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting campaigns:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get campaigns" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "subject", "fromName", "fromEmail", "templateId", "listIds"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate listIds is an array
    if (!Array.isArray(body.listIds) || body.listIds.length === 0) {
      return NextResponse.json(
        { error: "listIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds
    const campaign = {
      ...body,
      templateId: new ObjectId(body.templateId),
      listIds: body.listIds.map((id: string) => new ObjectId(id)),
      status: "draft"
    };

    // Create campaign
    const result = await campaignService.createCampaign(campaign, userId);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}