import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import client from '@/lib/db';
import { CampaignRecipient } from '@/lib/models/campaign';
import * as campaignService from "@/lib/services/campaign-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/campaigns/[id]/recipients
 * Get recipients for a campaign
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get campaign ID from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
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

    // Get recipients
    const result = await campaignService.getCampaignRecipients(id, page, limit, filter);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting campaign recipients:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get campaign recipients" },
      { status: 500 }
    );
  }
}