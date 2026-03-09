import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/instagram/config";

/**
 * GET /api/instagram/auth
 * Inicia fluxo OAuth do Instagram
 * Retorna URL de autorização para redirecionar o usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default_org_id";
    
    // Estado para validar callback (pode incluir organizationId)
    const state = Buffer.from(JSON.stringify({ 
      organizationId,
      timestamp: Date.now() 
    })).toString("base64");

    // Construir URL de autorização do Facebook OAuth
    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", config.appId);
    authUrl.searchParams.set("redirect_uri", config.redirectUri);
    authUrl.searchParams.set("scope", config.scopes.join(","));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.json({
      success: true,
      data: {
        authUrl: authUrl.toString(),
        state,
      },
    });
  } catch (error) {
    console.error("[Instagram Auth] Error generating auth URL:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate authorization URL",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
