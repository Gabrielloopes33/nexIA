import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/instagram/config";
import { encrypt } from "@/lib/crypto";

/**
 * GET /api/instagram/auth/callback
 * Recebe callback do Facebook OAuth após autorização
 * Flow: code → short-lived token → long-lived token → pages → instagram account
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const stateParam = searchParams.get("state");

  // Parse state para extrair organizationId
  let organizationId = "default_org_id";
  try {
    if (stateParam) {
      const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
      organizationId = state.organizationId || organizationId;
    }
  } catch {
    console.warn("[Instagram Callback] Invalid state parameter");
  }

  // Handle OAuth errors
  if (error) {
    console.error("[Instagram Callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/meta-api/instagram/connect?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    console.error("[Instagram Callback] No code provided");
    return NextResponse.redirect(
      new URL("/meta-api/instagram/connect?error=no_code", request.url)
    );
  }

  try {
    // Step 1: Exchange code for short-lived access token
    const shortLivedToken = await exchangeCodeForToken(code);
    
    // Step 2: Exchange short-lived for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken);
    
    // Step 3: Get user's pages
    const pages = await getUserPages(longLivedToken);
    
    if (pages.length === 0) {
      throw new Error("No Facebook pages found. Instagram Business Account requires a connected Facebook page.");
    }

    // Step 4: Find Instagram Business Account from pages
    const instagramAccount = await findInstagramBusinessAccount(pages, longLivedToken);
    
    if (!instagramAccount) {
      throw new Error("No Instagram Business Account found connected to any Facebook page.");
    }

    // Step 5: Get detailed account info
    const accountInfo = await getInstagramAccountInfo(instagramAccount.id, longLivedToken);

    // Step 6: Save to database
    const instance = await saveInstagramInstance({
      organizationId,
      instagramId: instagramAccount.id,
      username: accountInfo.username,
      name: accountInfo.name,
      profilePictureUrl: accountInfo.profilePictureUrl,
      accessToken: longLivedToken,
      pageAccessToken: instagramAccount.pageAccessToken,
      pageId: instagramAccount.pageId,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/meta-api/instagram?success=connected", request.url)
    );

  } catch (error) {
    console.error("[Instagram Callback] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/meta-api/instagram/connect?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

/**
 * Exchange authorization code for short-lived access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  const url = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${data.error?.message || JSON.stringify(data)}`);
  }

  if (!data.access_token) {
    throw new Error("No access token received from Facebook");
  }

  return data.access_token;
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
  const url = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Long-lived token exchange failed: ${data.error?.message || JSON.stringify(data)}`);
  }

  if (!data.access_token) {
    throw new Error("No long-lived token received");
  }

  return data.access_token;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

/**
 * Get user's Facebook pages
 */
async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
  const url = new URL("https://graph.facebook.com/v18.0/me/accounts");
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id,name,access_token");

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get pages: ${data.error?.message || JSON.stringify(data)}`);
  }

  return data.data || [];
}

interface InstagramBusinessAccount {
  id: string;
  pageId: string;
  pageAccessToken: string;
}

/**
 * Find Instagram Business Account connected to pages
 */
async function findInstagramBusinessAccount(
  pages: FacebookPage[],
  accessToken: string
): Promise<InstagramBusinessAccount | null> {
  for (const page of pages) {
    try {
      const url = new URL(`https://graph.facebook.com/v18.0/${page.id}`);
      url.searchParams.set("fields", "instagram_business_account");
      url.searchParams.set("access_token", page.access_token || accessToken);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.instagram_business_account?.id) {
        return {
          id: data.instagram_business_account.id,
          pageId: page.id,
          pageAccessToken: page.access_token,
        };
      }
    } catch (error) {
      console.warn(`[Instagram] Failed to check page ${page.id}:`, error);
      continue;
    }
  }
  return null;
}

interface InstagramAccountInfo {
  username: string;
  name?: string;
  profilePictureUrl?: string;
}

/**
 * Get Instagram account detailed info
 */
async function getInstagramAccountInfo(
  instagramId: string,
  accessToken: string
): Promise<InstagramAccountInfo> {
  const url = new URL(`https://graph.facebook.com/v18.0/${instagramId}`);
  url.searchParams.set("fields", "username,name,profile_picture_url");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get account info: ${data.error?.message || JSON.stringify(data)}`);
  }

  return {
    username: data.username,
    name: data.name,
    profilePictureUrl: data.profile_picture_url,
  };
}

interface SaveInstanceParams {
  organizationId: string;
  instagramId: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  accessToken: string;
  pageAccessToken: string;
  pageId: string;
}

/**
 * Save Instagram instance to database
 */
async function saveInstagramInstance(params: SaveInstanceParams) {
  const encryptedToken = encrypt(params.accessToken);
  const encryptedPageToken = encrypt(params.pageAccessToken);

  const instance = await prisma.instagramInstance.upsert({
    where: { instagramId: params.instagramId },
    update: {
      username: params.username,
      name: params.name,
      profilePictureUrl: params.profilePictureUrl,
      accessToken: encryptedToken,
      pageAccessToken: encryptedPageToken,
      pageId: params.pageId,
      status: "CONNECTED",
      connectedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      organizationId: params.organizationId,
      instagramId: params.instagramId,
      username: params.username,
      name: params.name,
      profilePictureUrl: params.profilePictureUrl,
      accessToken: encryptedToken,
      pageAccessToken: encryptedPageToken,
      pageId: params.pageId,
      status: "CONNECTED",
      connectedAt: new Date(),
    },
  });

  return instance;
}
