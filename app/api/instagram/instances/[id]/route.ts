import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/instagram/instances/[id]
 * Retorna detalhes de uma instância Instagram
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const instance = await prisma.instagramInstance.findUnique({
      where: { id },
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
        // Não retornar tokens
      },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: "Instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    console.error("[Instagram Instance] Error getting instance:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get Instagram instance",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instagram/instances/[id]
 * Remove uma instância Instagram
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.instagramInstance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Instance deleted successfully",
    });
  } catch (error) {
    console.error("[Instagram Instance] Error deleting instance:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete Instagram instance",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/instagram/instances/[id]
 * Atualiza uma instância Instagram
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    const instance = await prisma.instagramInstance.update({
      where: { id },
      data: { name },
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
      },
    });

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    console.error("[Instagram Instance] Error updating instance:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update Instagram instance",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
