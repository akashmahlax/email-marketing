import { NextRequest, NextResponse } from "next/server";
import * as campaignService from "@/lib/services/campaign-service";
import client from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    // Public endpoint for GitHub Actions trigger (ensure the URL isn't guessable in production)

    const db = (await client).db();
    const now = new Date();

    // Find due campaigns
    const due = await db
      .collection("campaigns")
      .find({ status: "scheduled", scheduledAt: { $lte: now } })
      .project({ _id: 1 })
      .toArray();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const c of due) {
      try {
        await campaignService.sendCampaign((c._id as ObjectId).toString());
        success++;
      } catch (e: any) {
        failed++;
        errors.push(`${(c._id as ObjectId).toString()}: ${e?.message || String(e)}`);
      }
    }

    return NextResponse.json({ processed: due.length, success, failed, errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Scheduler error" }, { status: 500 });
  }
}
