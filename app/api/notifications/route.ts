import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications
 * Lista notificações da organização/usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      organizationId,
    };

    if (userId) {
      where.OR = [
        { userId },
        { userId: null }, // Notificações para todos
      ];
    }

    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          organizationId,
          read: false,
          ...(userId && {
            OR: [{ userId }, { userId: null }],
          }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        total,
        unreadCount,
        limit,
        offset,
        hasMore: offset + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("[Notifications] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Cria uma nova notificação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      userId,
      type,
      title,
      message,
      link,
      metadata,
    } = body;

    if (!organizationId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        organizationId,
        userId: userId || null,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
        read: false,
      },
    });

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Notifications] Error creating:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
