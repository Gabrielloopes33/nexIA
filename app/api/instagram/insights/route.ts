import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { config } from "@/lib/instagram/config";

/**
 * GET /api/instagram/insights
 * Retorna métricas da conta Instagram
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");
    const period = (searchParams.get("period") || "day") as "day" | "week" | "month";

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

    // Fetch insights from Instagram API
    const insights = await fetchInstagramInsights(
      instance.instagramId,
      accessToken,
      period
    );

    // Get account info
    const accountInfo = await fetchAccountInfo(instance.instagramId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        account: {
          id: instance.instagramId,
          username: instance.username,
          name: instance.name,
          profilePictureUrl: instance.profilePictureUrl,
          followersCount: accountInfo.followers_count,
          followsCount: accountInfo.follows_count,
          mediaCount: accountInfo.media_count,
        },
        insights,
        period,
      },
    });
  } catch (error) {
    console.error("[Instagram Insights] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch Instagram insights",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

interface AccountInfo {
  followers_count: number;
  follows_count: number;
  media_count: number;
}

/**
 * Fetch account info
 */
async function fetchAccountInfo(
  instagramId: string,
  accessToken: string
): Promise<AccountInfo> {
  const url = new URL(`https://graph.facebook.com/${config.graphApiVersion}/${instagramId}`);
  url.searchParams.set("fields", "followers_count,follows_count,media_count");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  return {
    followers_count: data.followers_count || 0,
    follows_count: data.follows_count || 0,
    media_count: data.media_count || 0,
  };
}

interface InsightsData {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
}

/**
 * Fetch insights metrics
 */
async function fetchInstagramInsights(
  instagramId: string,
  accessToken: string,
  period: string
): Promise<InsightsData> {
  const metrics = [
    "impressions",
    "reach",
    "profile_views",
    "website_clicks",
  ];

  const url = new URL(`https://graph.facebook.com/${config.graphApiVersion}/${instagramId}/insights`);
  url.searchParams.set("metric", metrics.join(","));
  url.searchParams.set("period", period);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram Insights API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  // Parse insights data
  const insights: InsightsData = {
    impressions: 0,
    reach: 0,
    profileViews: 0,
    websiteClicks: 0,
  };

  for (const item of data.data || []) {
    const value = item.values?.[0]?.value || 0;
    switch (item.name) {
      case "impressions":
        insights.impressions = value;
        break;
      case "reach":
        insights.reach = value;
        break;
      case "profile_views":
        insights.profileViews = value;
        break;
      case "website_clicks":
        insights.websiteClicks = value;
        break;
    }
  }

  return insights;
}
