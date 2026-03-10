import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/instagram/instances
 * Lista instâncias Instagram da organização
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default_org_id";

    const instances = await prisma.instagramInstance.findMany({
      where: { organizationId },
      select: {
        id: true,
        instagramId: true,
        username: true,
        name: true,
        profilePictureUrl: true,
        status: true,
        connectedAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar tokens por segurança
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    console.error("[Instagram Instances] Error listing instances:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to list Instagram instances",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
