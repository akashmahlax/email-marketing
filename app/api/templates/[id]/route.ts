import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as templateService from "@/lib/services/template-service";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if a specific version is requested
    const searchParams = request.nextUrl.searchParams;
    const version = searchParams.get("version");
    
    let template;
    if (version) {
      template = await templateService.getTemplateVersion(params.id, parseInt(version));
    } else {
      template = await templateService.getTemplateById(params.id);
    }
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = session.user.id;
    const updatedTemplate = await templateService.updateTemplate(params.id, body, userId ?? '');
    return NextResponse.json(updatedTemplate);
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
    // Check if hard delete is requested
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get("hard") === "true";
    
    if (hardDelete) {
      await templateService.hardDeleteTemplate(params.id);
    } else {
      await templateService.deleteTemplate(params.id);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}