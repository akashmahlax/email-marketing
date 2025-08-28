import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import * as emailService from "@/lib/services/nodemailer-service";

/**
 * POST /api/test-email
 * Test email configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test email configuration
    const result = await emailService.testEmailConfiguration();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error testing email configuration:", error);
    return NextResponse.json(
      { 
        success: false,
        provider: "Unknown",
        error: error.message || "Failed to test email configuration" 
      },
      { status: 500 }
    );
  }
}
