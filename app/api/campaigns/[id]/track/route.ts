import { NextRequest, NextResponse } from "next/server";
import * as campaignService from "@/lib/services/campaign-service";

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * GET /api/campaigns/[id]/track
 * Track email opens and clicks
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Get campaign ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "open" or "click"
    const subscriberId = searchParams.get("sid");

    if (!type || !subscriberId) {
      return NextResponse.json(
        { error: "Missing required parameters: type and sid" },
        { status: 400 }
      );
    }

    if (type !== "open" && type !== "click") {
      return NextResponse.json(
        { error: "Invalid tracking type" },
        { status: 400 }
      );
    }

    // Track the event
    if (type === "open") {
      await campaignService.trackOpen(id, subscriberId);
    } else if (type === "click") {
      await campaignService.trackClick(id, subscriberId);
    }

    // Return a 1x1 transparent pixel for open tracking
    if (type === "open") {
      // Create a 1x1 transparent GIF
      const transparentPixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new NextResponse(transparentPixel, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // For click tracking, redirect to the target URL
    const url = searchParams.get("url");
    if (type === "click" && url) {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking campaign event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track campaign event" },
      { status: 500 }
    );
  }
}