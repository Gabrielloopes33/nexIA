import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db/whatsapp';

/**
 * POST /api/whatsapp/embedded-signup/callback
 * 
 * Handles the callback from Facebook OAuth after user authorization.
 * Exchanges the authorization code for a long-lived access token,
 * fetches WABA information, and saves the account to the database.
 * 
 * Request Body:
 * {
 *   code: string           - The authorization code from Facebook
 *   organizationId: string - Organization ID to associate the instance
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   instance: WhatsAppInstance
 * }
 */

// ============================================
// Types
// ============================================

interface CallbackRequestBody {
  code: string
  organizationId: string
}

interface FacebookAccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookBusinessAccount {
  id: string
  name: string
  verification_status?: string
}

interface FacebookBusinessesResponse {
  data: FacebookBusinessAccount[]
}

interface WhatsAppPhoneNumber {
  id: string
  display_phone_number: string
  verified_name: string
  quality_rating?: string
  status?: string
}

interface WhatsAppPhoneNumbersResponse {
  data: WhatsAppPhoneNumber[]
}

interface WABAResponse {
  id: string
  name: string
}

// ============================================
// Configuration
// ============================================

const FACEBOOK_CONFIG = {
  appId: process.env.FACEBOOK_APP_ID || "",
  appSecret: process.env.FACEBOOK_APP_SECRET || "",
  apiVersion: process.env.FACEBOOK_API_VERSION || "v18.0",
  redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/embedded-signup/callback`,
}

const GRAPH_API_BASE = `https://graph.facebook.com/${FACEBOOK_CONFIG.apiVersion}`

// ============================================
// Helper Functions
// ============================================

/**
 * Validates the request body
 */
function validateRequestBody(body: unknown): { valid: boolean; code?: string; organizationId?: string; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body" }
  }

  const { code, organizationId } = body as Record<string, unknown>

  if (typeof code !== "string" || !code.trim()) {
    return { valid: false, error: "Authorization code is required" }
  }

  if (typeof organizationId !== "string" || !organizationId.trim()) {
    return { valid: false, error: "Organization ID is required" }
  }

  return { valid: true, code: code.trim(), organizationId: organizationId.trim() }
}

/**
 * Exchanges the authorization code for an access token
 */
async function exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  console.log("[EmbeddedSignup Callback] Exchanging code for token...")

  const params = new URLSearchParams({
    client_id: FACEBOOK_CONFIG.appId,
    client_secret: FACEBOOK_CONFIG.appSecret,
    code,
    redirect_uri: FACEBOOK_CONFIG.redirectUri,
  })

  const url = `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
    },
  })

  const data = await response.json() as FacebookAccessTokenResponse & { error?: { message: string } }

  if (!response.ok) {
    console.error("[EmbeddedSignup Callback] Token exchange failed:", data)
    throw new Error(data.error?.message || "Failed to exchange code for token")
  }

  if (!data.access_token) {
    throw new Error("No access token received from Facebook")
  }

  console.log("[EmbeddedSignup Callback] Token exchanged successfully")
  return { 
    accessToken: data.access_token, 
    expiresIn: data.expires_in || 3600 
  }
}

/**
 * Fetches the user's businesses from Facebook
 */
async function fetchUserBusinesses(accessToken: string): Promise<FacebookBusinessAccount[]> {
  console.log("[EmbeddedSignup Callback] Fetching user businesses...")

  const url = `${GRAPH_API_BASE}/me/businesses?access_token=${accessToken}`

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })

  const data = await response.json() as FacebookBusinessesResponse & { error?: { message: string } }

  if (!response.ok) {
    console.error("[EmbeddedSignup Callback] Failed to fetch businesses:", data)
    throw new Error(data.error?.message || "Failed to fetch businesses")
  }

  console.log(`[EmbeddedSignup Callback] Found ${data.data?.length || 0} businesses`)
  return data.data || []
}

/**
 * Fetches WhatsApp Business Accounts for a business
 */
async function fetchWABAs(businessId: string, accessToken: string): Promise<WABAResponse[]> {
  console.log(`[EmbeddedSignup Callback] Fetching WABAs for business ${businessId}...`)

  const url = `${GRAPH_API_BASE}/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })

  const data = await response.json() as { data: WABAResponse[]; error?: { message: string } }

  if (!response.ok) {
    console.error("[EmbeddedSignup Callback] Failed to fetch WABAs:", data)
    throw new Error(data.error?.message || "Failed to fetch WABAs")
  }

  console.log(`[EmbeddedSignup Callback] Found ${data.data?.length || 0} WABAs`)
  return data.data || []
}

/**
 * Fetches phone numbers for a WABA
 */
async function fetchPhoneNumbers(wabaId: string, accessToken: string): Promise<WhatsAppPhoneNumber[]> {
  console.log(`[EmbeddedSignup Callback] Fetching phone numbers for WABA ${wabaId}...`)

  const url = `${GRAPH_API_BASE}/${wabaId}/phone_numbers?access_token=${accessToken}`

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })

  const data = await response.json() as WhatsAppPhoneNumbersResponse & { error?: { message: string } }

  if (!response.ok) {
    console.error("[EmbeddedSignup Callback] Failed to fetch phone numbers:", data)
    return []
  }

  console.log(`[EmbeddedSignup Callback] Found ${data.data?.length || 0} phone numbers`)
  return data.data || []
}

/**
 * Saves or updates the WhatsApp instance in the database
 */
async function saveWhatsAppInstance(
  organizationId: string,
  wabaId: string,
  wabaName: string,
  phoneNumber: WhatsAppPhoneNumber,
  accessToken: string,
  expiresIn: number
): Promise<unknown> {
  console.log("[EmbeddedSignup Callback] Saving WhatsApp instance to database...")

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)
  
  // Format phone number (remove non-digits for storage)
  const formattedPhone = phoneNumber.display_phone_number.replace(/\D/g, '')
  
  // Map quality rating
  const qualityRating = (phoneNumber.quality_rating?.toUpperCase() as 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN') || 'UNKNOWN'

  try {
    // Check if instance already exists for this WABA
    const existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        organizationId,
        wabaId,
      },
    })

    if (existingInstance) {
      // Update existing instance
      const updated = await prisma.whatsAppInstance.update({
        where: { id: existingInstance.id },
        data: {
          name: wabaName,
          phoneNumber: formattedPhone,
          phoneNumberId: phoneNumber.id,
          accessToken,
          tokenExpiresAt,
          status: 'CONNECTED',
          qualityRating,
          connectedAt: new Date(),
        },
      })
      console.log("[EmbeddedSignup Callback] Updated existing instance:", updated.id)
      return updated
    }

    // Create new instance
    const created = await prisma.whatsAppInstance.create({
      data: {
        organizationId,
        name: wabaName,
        phoneNumber: formattedPhone,
        phoneNumberId: phoneNumber.id,
        wabaId,
        accessToken,
        tokenExpiresAt,
        status: 'CONNECTED',
        qualityRating,
        connectedAt: new Date(),
      },
    })
    console.log("[EmbeddedSignup Callback] Created new instance:", created.id)
    return created
  } catch (error) {
    console.error("[EmbeddedSignup Callback] Database error:", error)
    throw new Error("Failed to save WhatsApp instance to database")
  }
}

/**
 * Mock implementation for development
 */
async function mockHandleCallback(code: string, organizationId: string): Promise<{ success: boolean; instance: unknown }> {
  console.log("[EmbeddedSignup Callback] Using mock implementation for development")
  console.log("[EmbeddedSignup Callback] Received code:", code.substring(0, 10) + "...")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Create mock instance
  const mockPhoneNumber = "5511987654321"
  const mockInstance = await prisma.whatsAppInstance.create({
    data: {
      organizationId,
      name: "NexIA Business (Mock)",
      phoneNumber: mockPhoneNumber,
      phoneNumberId: "mock_phone_id",
      wabaId: "mock_waba_id",
      accessToken: "mock_token",
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      status: 'CONNECTED',
      qualityRating: 'GREEN',
      connectedAt: new Date(),
    },
  })

  return {
    success: true,
    instance: mockInstance,
  }
}

// ============================================
// Main Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  console.log("[EmbeddedSignup Callback] Request received")

  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    // Validate request
    const validation = validateRequestBody(body)
    if (!validation.valid) {
      console.error("[EmbeddedSignup Callback] Validation failed:", validation.error)
      return NextResponse.json(
        { error: validation.error || "Invalid request" },
        { status: 400 }
      )
    }

    const { code, organizationId } = validation

    // Use mock implementation in development if no credentials configured
    if (process.env.NODE_ENV === "development" && !FACEBOOK_CONFIG.appSecret) {
      console.log("[EmbeddedSignup Callback] Using mock mode (no app secret configured)")
      const mockResult = await mockHandleCallback(code!, organizationId!)
      return NextResponse.json(mockResult, { status: 200 })
    }

    // Validate configuration
    if (!FACEBOOK_CONFIG.appId || !FACEBOOK_CONFIG.appSecret) {
      console.error("[EmbeddedSignup Callback] Missing Facebook app credentials")
      return NextResponse.json(
        { error: "Server configuration error", details: "Missing Facebook app credentials" },
        { status: 500 }
      )
    }

    // Step 1: Exchange code for access token
    const { accessToken, expiresIn } = await exchangeCodeForToken(code!)

    // Step 2: Fetch businesses
    const businesses = await fetchUserBusinesses(accessToken)
    if (businesses.length === 0) {
      throw new Error("No businesses found for this user")
    }

    // Step 3: Get the first business and fetch its WABAs
    const business = businesses[0]
    console.log("[EmbeddedSignup Callback] Using business:", business.id)

    const wabas = await fetchWABAs(business.id, accessToken)
    if (wabas.length === 0) {
      throw new Error("No WhatsApp Business Accounts found")
    }

    // Step 4: Get the first WABA
    const waba = wabas[0]
    console.log("[EmbeddedSignup Callback] Using WABA:", waba.id)

    // Step 5: Fetch phone numbers for this WABA
    const phoneNumbers = await fetchPhoneNumbers(waba.id, accessToken)
    
    if (phoneNumbers.length === 0) {
      throw new Error("No phone numbers found for this WABA")
    }

    // Use the first phone number
    const phoneNumber = phoneNumbers[0]
    const wabaName = waba.name || business.name || "WhatsApp Business"

    // Step 6: Save to database
    const instance = await saveWhatsAppInstance(
      organizationId!,
      waba.id,
      wabaName,
      phoneNumber,
      accessToken,
      expiresIn
    )

    console.log("[EmbeddedSignup Callback] Success!")
    return NextResponse.json({
      success: true,
      instance,
    }, { status: 200 })
  } catch (error) {
    console.error("[EmbeddedSignup Callback] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for OAuth redirect (alternative flow)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const organizationId = searchParams.get("organization_id")

  console.log("[EmbeddedSignup Callback] GET request received")

  // Handle error from Facebook
  if (error) {
    console.error("[EmbeddedSignup Callback] Facebook error:", error, errorDescription)
    const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set("error", error)
    redirectUrl.searchParams.set("error_description", errorDescription || "")
    return NextResponse.redirect(redirectUrl)
  }

  // Handle success with code
  if (code && organizationId) {
    console.log("[EmbeddedSignup Callback] Received code via GET, processing...")
    
    try {
      // Process the code same as POST
      const result = await POST(
        new NextRequest(request.url, {
          method: "POST",
          body: JSON.stringify({ code, organizationId }),
          headers: { "Content-Type": "application/json" },
        })
      )

      const data = await result.json()

      if (data.success) {
        const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL)
        redirectUrl.searchParams.set("success", "true")
        return NextResponse.redirect(redirectUrl)
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL)
      redirectUrl.searchParams.set("error", "callback_failed")
      redirectUrl.searchParams.set("error_description", message)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // No code or error - invalid request
  return NextResponse.json(
    { error: "Invalid request. Missing code or organization_id parameter." },
    { status: 400 }
  )
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
