import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { upsertWhatsAppInstance, CreateInstanceInput } from '@/lib/db/whatsapp';
import {
  exchangeCodeForTokenEmbedded,
  exchangeCodeForToken,
  fetchUserBusinesses,
  fetchPhoneNumbers,
  formatPhoneNumber,
  mapQualityRating,
  calculateTokenExpiry,
  type ExchangeResult,
  type WhatsAppPhoneNumber,
} from '@/lib/whatsapp/embedded-signup';

/**
 * POST /api/whatsapp/embedded-signup/callback
 * 
 * Handles the callback from Facebook Embedded Signup (Tech Provider flow).
 * 
 * Tech Provider Key Difference:
 * - Troca de code por access_token NÃO usa redirect_uri
 * - Recebe waba_id e phone_number_id do frontend (via postMessage)
 * 
 * Actions suportadas:
 * - embedded_signup_complete: Fluxo Tech Provider (SEM redirect_uri)
 * - oauth_callback: OAuth clássico (COM redirect_uri)
 * - exchange_code: Troca explícita de code (híbrido)
 * 
 * Request Body (embedded_signup_complete):
 * {
 *   action: "embedded_signup_complete",
 *   code: string,              - Authorization code from Facebook
 *   organizationId: string,    - Organization ID to associate
 *   wabaId?: string,          - WhatsApp Business Account ID (from postMessage)
 *   phoneNumberId?: string,   - Phone Number ID (from postMessage)
 *   agentId?: string,         - Optional agent ID
 *   unitId?: string           - Optional unit ID
 * }
 * 
 * Request Body (oauth_callback):
 * {
 *   action: "oauth_callback",
 *   code: string,
 *   organizationId: string,
 *   redirectUri: string,       - Required for OAuth flow
 *   agentId?: string,
 *   unitId?: string
 * }
 */

// ============================================
// Types
// ============================================

interface EmbeddedSignupCompleteBody {
  action: "embedded_signup_complete";
  code: string;
  organizationId: string;
  wabaId?: string;
  phoneNumberId?: string;
  agentId?: string;
  unitId?: string;
}

interface OAuthCallbackBody {
  action: "oauth_callback";
  code: string;
  organizationId: string;
  redirectUri: string;
  agentId?: string;
  unitId?: string;
}

interface ExchangeCodeBody {
  action: "exchange_code";
  code: string;
  organizationId: string;
  redirectUri?: string;
  wabaId?: string;
  phoneNumberId?: string;
  agentId?: string;
  unitId?: string;
}

type CallbackRequestBody = EmbeddedSignupCompleteBody | OAuthCallbackBody | ExchangeCodeBody;

// ============================================
// Helper Functions
// ============================================

/**
 * Valida o corpo da requisição
 */
function validateRequestBody(body: unknown): { valid: boolean; data?: CallbackRequestBody; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const bodyRecord = body as Record<string, unknown>;
  const inferredAction =
    typeof bodyRecord.action === "string"
      ? bodyRecord.action
      : (typeof bodyRecord.code === "string" && bodyRecord.code.trim())
        ? "embedded_signup_complete"
        : undefined;

  const action = inferredAction;

  if (typeof action !== "string") {
    return { valid: false, error: "Missing or invalid action" };
  }

  // Validar embedded_signup_complete
  if (action === "embedded_signup_complete") {
    const { code, organizationId } = body as Record<string, unknown>;
    if (typeof code !== "string" || !code.trim()) {
      return { valid: false, error: "Authorization code is required" };
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      return { valid: false, error: "Organization ID is required" };
    }
    return { valid: true, data: body as EmbeddedSignupCompleteBody };
  }

  // Validar oauth_callback
  if (action === "oauth_callback") {
    const { code, organizationId, redirectUri } = body as Record<string, unknown>;
    if (typeof code !== "string" || !code.trim()) {
      return { valid: false, error: "Authorization code is required" };
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      return { valid: false, error: "Organization ID is required" };
    }
    if (typeof redirectUri !== "string" || !redirectUri.trim()) {
      return { valid: false, error: "Redirect URI is required for OAuth callback" };
    }
    return { valid: true, data: body as OAuthCallbackBody };
  }

  // Validar exchange_code
  if (action === "exchange_code") {
    const { code, organizationId } = body as Record<string, unknown>;
    if (typeof code !== "string" || !code.trim()) {
      return { valid: false, error: "Authorization code is required" };
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      return { valid: false, error: "Organization ID is required" };
    }
    return { valid: true, data: body as ExchangeCodeBody };
  }

  return { valid: false, error: `Unknown action: ${action}` };
}

/**
 * Busca informações da Meta API e monta dados da instância
 */
async function buildInstanceData(
  accessToken: string,
  expiresIn: number | undefined,
  params: {
    organizationId: string;
    wabaId?: string;
    phoneNumberId?: string;
    agentId?: string;
    unitId?: string;
  }
): Promise<CreateInstanceInput & { status: 'CONNECTED' | 'PENDING_SETUP' }> {
  const { organizationId, wabaId: providedWabaId, phoneNumberId: providedPhoneNumberId, agentId, unitId } = params;

  let wabaId = providedWabaId || "";
  let phoneNumberId = providedPhoneNumberId || "";
  let displayPhoneNumber: string | null = null;
  let verifiedName = "WhatsApp Business";
  let qualityRating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN" = "UNKNOWN";

  // Se temos waba_id, buscar informações dos telefones
  if (wabaId) {
    try {
      const phoneNumbers = await fetchPhoneNumbers(wabaId, accessToken);

      if (providedPhoneNumberId && !phoneNumbers.some((phone) => phone.id === providedPhoneNumberId)) {
        throw new Error("Provided phone_number_id does not belong to the informed waba_id");
      }

      const phoneInfo = phoneNumbers[0];

      if (phoneInfo) {
        phoneNumberId = phoneNumberId || phoneInfo.id;
        displayPhoneNumber = phoneInfo.display_phone_number || null;
        verifiedName = phoneInfo.verified_name || verifiedName;
        qualityRating = mapQualityRating(phoneInfo.quality_rating);
        console.log(`[EmbeddedSignup][org=${organizationId}] Stage: asset_validation wabaId=${wabaId} phoneNumberId=${phoneNumberId} displayPhone=${displayPhoneNumber} qualityRating=${qualityRating}`);
      } else {
        console.warn(`[EmbeddedSignup][org=${organizationId}] Stage: asset_validation NO phone numbers found for wabaId=${wabaId}`);
      }
    } catch (error) {
      console.error(`[EmbeddedSignup][org=${organizationId}] Stage: asset_validation FAILED for wabaId=${wabaId}:`, error);
    }
  }

  // Se ainda não temos waba_id, tentar buscar via businesses
  if (!wabaId) {
    try {
      const businesses = await fetchUserBusinesses(accessToken);
      if (businesses.length > 0) {
        verifiedName = businesses[0].name || verifiedName;
        // Aqui poderíamos buscar WABAs do business, mas sem o ID específico
        // é melhor deixar como pending_setup
      }
    } catch (error) {
      console.warn("[EmbeddedSignup] Could not fetch businesses:", error);
    }
  }

  return {
    organizationId,
    name: verifiedName,
    phoneNumber: displayPhoneNumber ? formatPhoneNumber(displayPhoneNumber) : "",
    phoneNumberId: phoneNumberId || undefined,
    wabaId: wabaId || undefined,
    accessToken,
    tokenExpiresAt: calculateTokenExpiry(expiresIn),
    status: wabaId ? "CONNECTED" : "PENDING_SETUP",
  };
}

/**
 * Implementação de mock para desenvolvimento
 */
async function mockHandleCallback(
  organizationId: string,
  wabaId?: string,
  phoneNumberId?: string
): Promise<{ success: boolean; instance: unknown }> {
  console.log("[EmbeddedSignup] Using mock implementation for development");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Criar instância mock
  const mockInstance = await prisma.whatsAppInstance.create({
    data: {
      organizationId,
      name: "NexIA Business (Mock)",
      phoneNumber: "5511987654321",
      phoneNumberId: phoneNumberId || "mock_phone_id",
      wabaId: wabaId || "mock_waba_id",
      accessToken: "mock_token",
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      status: "CONNECTED",
      qualityRating: "GREEN",
      connectedAt: new Date(),
    },
  });

  return {
    success: true,
    instance: mockInstance,
  };
}

// ============================================
// Action Handlers
// ============================================

/**
 * Handler para embedded_signup_complete (Tech Provider)
 * Troca code SEM redirect_uri
 */
async function handleEmbeddedSignupComplete(
  data: EmbeddedSignupCompleteBody
): Promise<NextResponse> {
  const { code, organizationId, wabaId, phoneNumberId, agentId, unitId } = data;

  const correlationLog = `[EmbeddedSignup][org=${organizationId}][waba=${wabaId ?? "?"}][phone=${phoneNumberId ?? "?"}]`;
  console.log(`${correlationLog} Processing embedded_signup_complete`);

  // 1. Trocar código por access_token (SEM redirect_uri para Tech Provider)
  console.log(`${correlationLog} Stage: token_exchange`);
  const exchange: ExchangeResult = await exchangeCodeForTokenEmbedded(code);
  if (!exchange.ok) {
    console.error(`${correlationLog} Stage: token_exchange FAILED:`, exchange.details);
    return NextResponse.json(
      { 
        success: false, 
        error: exchange.message || "Token exchange failed",
        details: exchange.details,
      },
      { status: 400 }
    );
  }

  const { accessToken, expiresIn } = exchange;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "No access token received" },
      { status: 500 }
    );
  }

  // 2. Buscar informações e montar dados da instância
  const instanceData = await buildInstanceData(accessToken, expiresIn, {
    organizationId,
    wabaId,
    phoneNumberId,
    agentId,
    unitId,
  });

  // 3. Upsert no banco de dados
  const instance = await upsertWhatsAppInstance({
    organizationId,
    wabaId: instanceData.wabaId,
    phoneNumberId: instanceData.phoneNumberId,
    data: instanceData,
  });

  console.log(`${correlationLog} Stage: upsert instanceId=${instance.id} status=${instanceData.status} wabaId=${instanceData.wabaId ?? "?"} phoneNumberId=${instanceData.phoneNumberId ?? "?"}`);

  return NextResponse.json({
    success: true,
    instance,
    message: "WhatsApp conectado com sucesso via Embedded Signup!",
  }, { status: 200 });
}

/**
 * Handler para oauth_callback (OAuth clássico)
 * Troca code COM redirect_uri
 */
async function handleOAuthCallback(
  data: OAuthCallbackBody
): Promise<NextResponse> {
  const { code, organizationId, redirectUri, agentId, unitId } = data;

  console.log("[EmbeddedSignup] Processing oauth_callback");
  console.log(`[EmbeddedSignup] organizationId=${organizationId}, redirectUri=${redirectUri}`);

  // 1. Trocar código por access_token (COM redirect_uri)
  const exchange: ExchangeResult = await exchangeCodeForToken(code, redirectUri);
  if (!exchange.ok) {
    console.error("[EmbeddedSignup] Token exchange failed:", exchange.details);
    return NextResponse.json(
      { 
        success: false, 
        error: exchange.message || "Token exchange failed",
        details: exchange.details,
      },
      { status: 400 }
    );
  }

  const { accessToken, expiresIn } = exchange;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "No access token received" },
      { status: 500 }
    );
  }

  // 2. Criar instância com status pending_setup (sem waba_id ainda)
  const instanceData: CreateInstanceInput = {
    organizationId,
    name: "WhatsApp Pending Setup",
    phoneNumber: "",
    accessToken,
    tokenExpiresAt: calculateTokenExpiry(expiresIn),
  };

  // 3. Upsert no banco de dados
  const instance = await upsertWhatsAppInstance({
    organizationId,
    data: instanceData,
  });

  console.log("[EmbeddedSignup] OAuth callback processed successfully:", instance.id);

  return NextResponse.json({
    success: true,
    instance,
    message: "Autenticação concluída. Configure o WhatsApp Business manualmente no dashboard.",
  }, { status: 200 });
}

/**
 * Handler para exchange_code (fluxo híbrido)
 * Usa redirect_uri se fornecido, senão usa Tech Provider
 */
async function handleExchangeCode(
  data: ExchangeCodeBody
): Promise<NextResponse> {
  const { code, organizationId, redirectUri, wabaId, phoneNumberId, agentId, unitId } = data;

  console.log("[EmbeddedSignup] Processing exchange_code");
  console.log(`[EmbeddedSignup] organizationId=${organizationId}, hasRedirectUri=${!!redirectUri}`);

  // 1. Trocar código por access_token
  const exchange: ExchangeResult = redirectUri
    ? await exchangeCodeForToken(code, redirectUri)
    : await exchangeCodeForTokenEmbedded(code);

  if (!exchange.ok) {
    console.error("[EmbeddedSignup] Token exchange failed:", exchange.details);
    return NextResponse.json(
      { 
        success: false, 
        error: exchange.message || "Token exchange failed",
        details: exchange.details,
      },
      { status: 400 }
    );
  }

  const { accessToken, expiresIn } = exchange;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "No access token received" },
      { status: 500 }
    );
  }

  // 2. Buscar informações e montar dados da instância
  const instanceData = await buildInstanceData(accessToken, expiresIn, {
    organizationId,
    wabaId,
    phoneNumberId,
    agentId,
    unitId,
  });

  // 3. Upsert no banco de dados
  const instance = await upsertWhatsAppInstance({
    organizationId,
    wabaId: instanceData.wabaId,
    phoneNumberId: instanceData.phoneNumberId,
    data: instanceData,
  });

  return NextResponse.json({
    success: true,
    instance,
  }, { status: 200 });
}

// ============================================
// Main Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  console.log("[EmbeddedSignup] Request received");

  try {
    // Authenticate request and get organizationId from session
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário sem organização na sessão. Faça login novamente." },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Inject organizationId from authenticated session (always trust session, not body)
    if (typeof body === "object" && body !== null) {
      (body as Record<string, unknown>).organizationId = user.organizationId;
    }

    // Validar request
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      console.error("[EmbeddedSignup] Validation failed:", validation.error);
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid request" },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Verificar modo mock em desenvolvimento
    const useMock = process.env.NODE_ENV === "development" && !process.env.FACEBOOK_APP_SECRET;
    if (useMock) {
      console.log("[EmbeddedSignup] Using mock mode (no app secret configured)");
      const mockResult = await mockHandleCallback(
        data.organizationId,
        "wabaId" in data ? data.wabaId : undefined,
        "phoneNumberId" in data ? data.phoneNumberId : undefined
      );
      return NextResponse.json(mockResult, { status: 200 });
    }

    // Roteamento por action
    switch (data.action) {
      case "embedded_signup_complete":
        return handleEmbeddedSignupComplete(data);
      case "oauth_callback":
        return handleOAuthCallback(data);
      case "exchange_code":
        return handleExchangeCode(data);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${(data as { action: string }).action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("[EmbeddedSignup] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler para OAuth redirect (fluxo alternativo)
 * Mantido para compatibilidade com fluxos legados
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const organizationId = searchParams.get("organization_id");

  console.log("[EmbeddedSignup] GET request received");

  // Handle error from Facebook
  if (error) {
    console.error("[EmbeddedSignup] Facebook error:", error, errorDescription);
    const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL || "/");
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", errorDescription || "");
    return NextResponse.redirect(redirectUrl);
  }

  // Handle success with code
  if (code && organizationId) {
    console.log("[EmbeddedSignup] Received code via GET, processing...");
    
    try {
      // Redirecionar para o handler POST
      const result = await POST(
        new NextRequest(request.url, {
          method: "POST",
          body: JSON.stringify({ 
            action: "exchange_code", 
            code, 
            organizationId 
          }),
          headers: { "Content-Type": "application/json" },
        })
      );

      const resultData = await result.json();

      if (resultData.success) {
        const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL || "/");
        redirectUrl.searchParams.set("success", "true");
        return NextResponse.redirect(redirectUrl);
      } else {
        throw new Error(resultData.error || "Unknown error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const redirectUrl = new URL("/integracoes/whatsapp", process.env.NEXT_PUBLIC_APP_URL || "/");
      redirectUrl.searchParams.set("error", "callback_failed");
      redirectUrl.searchParams.set("error_description", message);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code or error - invalid request
  return NextResponse.json(
    { success: false, error: "Invalid request. Missing code or organization_id parameter." },
    { status: 400 }
  );
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
