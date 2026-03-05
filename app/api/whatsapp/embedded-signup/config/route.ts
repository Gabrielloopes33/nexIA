import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/whatsapp/embedded-signup/config
 * 
 * Returns the Facebook App configuration for Embedded Signup.
 * This endpoint provides the necessary configuration to initialize
 * the Facebook SDK and launch the Embedded Signup flow.
 * 
 * Response:
 * {
 *   configId: string     - The Configuration ID from Facebook App Dashboard
 *   appId: string        - The Facebook App ID
 *   apiVersion: string   - The Graph API version to use
 * }
 */

export interface EmbeddedSignupConfigResponse {
  configId: string
  appId: string
  apiVersion: string
}

// Facebook API Configuration
// These values should be set in environment variables
const FACEBOOK_CONFIG = {
  configId: process.env.FACEBOOK_EMBEDDED_SIGNUP_CONFIG_ID || "",
  appId: process.env.FACEBOOK_APP_ID || "",
  apiVersion: process.env.FACEBOOK_API_VERSION || "v18.0",
}

/**
 * Validates that all required configuration is present
 */
function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (!FACEBOOK_CONFIG.configId) {
    missing.push("FACEBOOK_EMBEDDED_SIGNUP_CONFIG_ID")
  }
  if (!FACEBOOK_CONFIG.appId) {
    missing.push("FACEBOOK_APP_ID")
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * GET handler for Embedded Signup configuration
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<EmbeddedSignupConfigResponse | { error: string; details?: string }>> {
  console.log("[EmbeddedSignup Config] Request received")

  try {
    // Validate configuration
    const validation = validateConfig()
    
    if (!validation.valid) {
      console.error("[EmbeddedSignup Config] Missing configuration:", validation.missing)
      
      // In development, return mock config for testing
      if (process.env.NODE_ENV === "development") {
        console.log("[EmbeddedSignup Config] Using mock configuration for development")
        return NextResponse.json({
          configId: "mock_config_id_for_development",
          appId: "mock_app_id_for_development",
          apiVersion: "v18.0",
        }, { status: 200 })
      }

      return NextResponse.json(
        {
          error: "Configuration error",
          details: `Missing environment variables: ${validation.missing.join(", ")}`,
        },
        { status: 500 }
      )
    }

    const response: EmbeddedSignupConfigResponse = {
      configId: FACEBOOK_CONFIG.configId,
      appId: FACEBOOK_CONFIG.appId,
      apiVersion: FACEBOOK_CONFIG.apiVersion,
    }

    console.log("[EmbeddedSignup Config] Returning configuration:", {
      ...response,
      configId: "***", // Mask sensitive data in logs
      appId: "***",
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[EmbeddedSignup Config] Unexpected error:", error)
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
