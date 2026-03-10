import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/instagram/embedded-signup/callback
 * Processa o callback do Embedded Signup do Instagram
 * Troca o código por token de acesso e busca informações da conta
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code is required" },
        { status: 400 }
      );
    }

    const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || "";
    const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "";
    
    // Redirect URI deve ser o mesmo usado no frontend
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/auth/callback`
      : "http://localhost:3000/api/instagram/auth/callback";

    if (!appId || !appSecret) {
      console.error("[Instagram Callback] Missing app credentials");
      return NextResponse.json(
        { success: false, error: "App credentials not configured" },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Instagram Callback] Token exchange failed:", tokenData);
      return NextResponse.json(
        { success: false, error: tokenData.error?.message || "Failed to exchange code for token" },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user's Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !pagesData.data || pagesData.data.length === 0) {
      console.error("[Instagram Callback] No pages found:", pagesData);
      return NextResponse.json(
        { success: false, error: "No Facebook pages found. Please create a Facebook page first." },
        { status: 400 }
      );
    }

    // Get the first page that has Instagram account connected
    let instagramAccount = null;
    
    for (const page of pagesData.data) {
      // Check if page has Instagram account
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        // Get Instagram account details
        const igDetailsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url,followers_count,following_count,media_count&access_token=${page.access_token}`
        );
        const igDetails = await igDetailsResponse.json();

        if (igDetailsResponse.ok) {
          instagramAccount = {
            id: igData.instagram_business_account.id,
            instagramId: igData.instagram_business_account.id,
            username: igDetails.username,
            name: igDetails.name,
            profilePictureUrl: igDetails.profile_picture_url,
            followersCount: igDetails.followers_count,
            followingCount: igDetails.following_count,
            mediaCount: igDetails.media_count,
            pageId: page.id,
            pageAccessToken: page.access_token,
          };
          break;
        }
      }
    }

    if (!instagramAccount) {
      return NextResponse.json(
        { success: false, error: "No Instagram Business account found connected to your Facebook pages." },
        { status: 400 }
      );
    }

    // Return account information
    return NextResponse.json({
      success: true,
      account: {
        id: instagramAccount.id,
        instagramId: instagramAccount.instagramId,
        username: instagramAccount.username,
        accessToken: accessToken,
      },
      details: instagramAccount,
    });

  } catch (error) {
    console.error("[Instagram Callback] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
