import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import client from '@/lib/db';
import { Campaign } from '@/lib/models/campaign';
import * as campaignService from "@/lib/services/campaign-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/campaigns/[id]/schedule
 * Schedule a campaign for sending
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

    // Parse request body
    const body = await request.json();

    // Validate scheduledAt
    if (!body.scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 }
      );
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledAt date" },
        { status: 400 }
      );
    }

    // Schedule campaign
    const result = await campaignService.scheduleCampaign(id, scheduledAt);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error scheduling campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule campaign" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]/schedule
 * Cancel a scheduled campaign
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    // Cancel campaign
    const result = await campaignService.cancelCampaign(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error cancelling campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel campaign" },
      { status: 500 }
    );
  }
}