import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/whatsapp/embedded-signup/callback
 * 
 * Handles the callback from Facebook OAuth after user authorization.
 * Exchanges the authorization code for a long-lived access token,
 * fetches WABA information, and saves the account to the database.
 * 
 * Request Body:
 * {
 *   code: string  - The authorization code from Facebook
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   account: {
 *     id: string
 *     name: string
 *     wabaId: string
 *     status: string
 *     phoneNumbers: array
 *   }
 *   accessToken: string
 * }
 */

// ============================================
// Types
// ============================================

interface CallbackRequestBody {
  code: string
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

interface EmbeddedSignupResult {
  success: boolean
  account: {
    id: string
    name: string
    wabaId: string
    status: string
    phoneNumbers: Array<{
      id: string
      displayPhoneNumber: string
      verifiedName: string
      status: string
    }>
  }
  accessToken: string
  error?: string
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
function validateRequestBody(body: unknown): { valid: boolean; code?: string; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body" }
  }

  const { code } = body as Record<string, unknown>

  if (typeof code !== "string" || !code.trim()) {
    return { valid: false, error: "Authorization code is required" }
  }

  return { valid: true, code: code.trim() }
}

/**
 * Exchanges the authorization code for an access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
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
  return data.access_token
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
    // Don't throw here, just return empty array
    return []
  }

  console.log(`[EmbeddedSignup Callback] Found ${data.data?.length || 0} phone numbers`)
  return data.data || []
}

/**
 * Fetches user info to get the name
 */
async function fetchUserInfo(accessToken: string): Promise<{ id: string; name?: string }> {
  console.log("[EmbeddedSignup Callback] Fetching user info...")

  const url = `${GRAPH_API_BASE}/me?fields=id,name&access_token=${accessToken}`

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })

  const data = await response.json() as { id: string; name?: string; error?: { message: string } }

  if (!response.ok) {
    console.error("[EmbeddedSignup Callback] Failed to fetch user info:", data)
    return { id: "unknown", name: "Unknown" }
  }

  return data
}

/**
 * Mock implementation for development
 */
async function mockHandleCallback(code: string): Promise<EmbeddedSignupResult> {
  console.log("[EmbeddedSignup Callback] Using mock implementation for development")
  console.log("[EmbeddedSignup Callback] Received code:", code.substring(0, 10) + "...")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Return mock data
  return {
    success: true,
    account: {
      id: `waba_${Date.now()}`,
      name: "NexIA Business",
      wabaId: "123456789012345",
      status: "connected",
      phoneNumbers: [
        {
          id: "phone_001",
          displayPhoneNumber: "+55 11 98765-4321",
          verifiedName: "NexIA Suporte",
          status: "VERIFIED",
        },
        {
          id: "phone_002",
          displayPhoneNumber: "+55 11 91234-5678",
          verifiedName: "NexIA Vendas",
          status: "VERIFIED",
        },
      ],
    },
    accessToken: `mock_token_${Date.now()}`,
  }
}

/**
 * Saves the account to the database
 * (Mock implementation - replace with actual database call)
 */
async function saveAccountToDatabase(
  account: EmbeddedSignupResult["account"],
  accessToken: string
): Promise<void> {
  console.log("[EmbeddedSignup Callback] Saving account to database...")
  console.log("[EmbeddedSignup Callback] Account:", {
    ...account,
    accessToken: "***",
  })

  // TODO: Replace with actual database save
  // Example with Prisma:
  // await prisma.whatsappAccount.create({
  //   data: {
  //     id: account.id,
  //     name: account.name,
  //     wabaId: account.wabaId,
  //     status: account.status,
  //     accessToken: encrypt(accessToken), // Encrypt the token!
  //     phoneNumbers: {
  //       create: account.phoneNumbers,
  //     },
  //   },
  // })

  // For now, just log it
  console.log("[EmbeddedSignup Callback] Account saved (mock)")
}

// ============================================
// Main Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<EmbeddedSignupResult | { error: string; details?: string }>> {
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

    const { code } = validation

    // Use mock implementation in development if no credentials configured
    if (process.env.NODE_ENV === "development" && !FACEBOOK_CONFIG.appSecret) {
      console.log("[EmbeddedSignup Callback] Using mock mode (no app secret configured)")
      const mockResult = await mockHandleCallback(code!)
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
    const accessToken = await exchangeCodeForToken(code!)

    // Step 2: Fetch user info
    const userInfo = await fetchUserInfo(accessToken)
    console.log("[EmbeddedSignup Callback] User:", userInfo.id)

    // Step 3: Fetch businesses
    const businesses = await fetchUserBusinesses(accessToken)
    if (businesses.length === 0) {
      throw new Error("No businesses found for this user")
    }

    // Step 4: Get the first business and fetch its WABAs
    const business = businesses[0]
    console.log("[EmbeddedSignup Callback] Using business:", business.id)

    const wabas = await fetchWABAs(business.id, accessToken)
    if (wabas.length === 0) {
      throw new Error("No WhatsApp Business Accounts found")
    }

    // Step 5: Get the first WABA
    const waba = wabas[0]
    console.log("[EmbeddedSignup Callback] Using WABA:", waba.id)

    // Step 6: Fetch phone numbers for this WABA
    const phoneNumbers = await fetchPhoneNumbers(waba.id, accessToken)

    // Step 7: Build the result
    const result: EmbeddedSignupResult = {
      success: true,
      account: {
        id: `waba_${Date.now()}`,
        name: waba.name || business.name || "WhatsApp Business",
        wabaId: waba.id,
        status: "connected",
        phoneNumbers: phoneNumbers.map((phone) => ({
          id: phone.id,
          displayPhoneNumber: phone.display_phone_number,
          verifiedName: phone.verified_name,
          status: phone.status || "UNKNOWN",
        })),
      },
      accessToken: accessToken,
    }

    // Step 8: Save to database
    await saveAccountToDatabase(result.account, accessToken)

    console.log("[EmbeddedSignup Callback] Success!")
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[EmbeddedSignup Callback] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        success: false,
        account: null as unknown as EmbeddedSignupResult["account"],
        accessToken: "",
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

  console.log("[EmbeddedSignup Callback] GET request received")

  // Handle error from Facebook
  if (error) {
    console.error("[EmbeddedSignup Callback] Facebook error:", error, errorDescription)
    // Redirect to error page
    const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set("error", error)
    redirectUrl.searchParams.set("error_description", errorDescription || "")
    return NextResponse.redirect(redirectUrl)
  }

  // Handle success with code
  if (code) {
    console.log("[EmbeddedSignup Callback] Received code via GET, processing...")
    
    try {
      // Process the code same as POST
      const result = await POST(
        new NextRequest(request.url, {
          method: "POST",
          body: JSON.stringify({ code }),
          headers: { "Content-Type": "application/json" },
        })
      )

      const data = await result.json()

      if (data.success) {
        // Redirect to success page
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
    { error: "Invalid request. Missing code or error parameter." },
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
