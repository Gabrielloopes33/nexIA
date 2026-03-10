import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/instagram/logs
 * Lista logs de eventos do Instagram
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const skip = (page - 1) * limit;

    const where = instanceId ? { instagramId: instanceId } : {};

    const [logs, total] = await Promise.all([
      prisma.instagramLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          instagramInstance: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.instagramLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Instagram Logs] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch Instagram logs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instagram/logs
 * Cria um log de evento (usado internamente pelo webhook)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, eventType, payload, status } = body;

    if (!instanceId || !eventType) {
      return NextResponse.json(
        { success: false, error: "instanceId and eventType are required" },
        { status: 400 }
      );
    }

    const log = await prisma.instagramLog.create({
      data: {
        instagramId: instanceId,
        eventType,
        payload: payload || {},
        status: status || "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("[Instagram Logs] Error creating log:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create log",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
