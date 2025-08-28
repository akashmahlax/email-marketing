import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import client from '@/lib/db';
import { Campaign } from '@/lib/models/campaign';
import * as campaignService from "@/lib/services/campaign-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/campaigns/[id]/send
 * Send a campaign immediately
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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

    // Send campaign
    const result = await campaignService.sendCampaign(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send campaign" },
      { status: 500 }
    );
  }
}