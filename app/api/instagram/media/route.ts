import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { config } from "@/lib/instagram/config";

/**
 * GET /api/instagram/media
 * Lista mídias recentes da conta Instagram
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");
    const limit = parseInt(searchParams.get("limit") || "25");
    const after = searchParams.get("after"); // Pagination cursor

    if (!instanceId) {
      return NextResponse.json(
        { success: false, error: "instanceId is required" },
        { status: 400 }
      );
    }

    // Get instance
    const instance = await prisma.instagramInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: "Instance not found" },
        { status: 404 }
      );
    }

    if (instance.status !== "CONNECTED") {
      return NextResponse.json(
        { success: false, error: "Instance not connected" },
        { status: 400 }
      );
    }

    // Decrypt token
    const accessToken = decrypt(instance.accessToken);

    // Fetch media from Instagram API
    const media = await fetchInstagramMedia(
      instance.instagramId,
      accessToken,
      limit,
      after
    );

    return NextResponse.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("[Instagram Media] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch Instagram media",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

interface InstagramMediaItem {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
}

interface MediaResponse {
  data: InstagramMediaItem[];
  paging?: {
    cursors?: {
      after?: string;
    };
    next?: string;
  };
}

/**
 * Fetch media from Instagram API
 */
async function fetchInstagramMedia(
  instagramId: string,
  accessToken: string,
  limit: number,
  after?: string | null
): Promise<MediaResponse> {
  const url = new URL(`https://graph.facebook.com/${config.graphApiVersion}/${instagramId}/media`);
  url.searchParams.set("fields", "id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count,timestamp");
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("access_token", accessToken);

  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram Media API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  return {
    data: data.data || [],
    paging: data.paging,
  };
}
