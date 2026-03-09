/**
 * WhatsApp Embedded Signup Helpers
 * 
 * Funções auxiliares para o fluxo de Embedded Signup do WhatsApp (Tech Provider).
 * Baseado na implementação do Aurea - supabase/functions/meta-auth/index.ts
 * 
 * Key difference para Tech Provider:
 * - Troca de code por access_token NÃO usa redirect_uri
 * 
 * @module lib/whatsapp/embedded-signup
 */

// ============================================
// Configuration
// ============================================

const GRAPH_API_VERSION = process.env.FACEBOOK_API_VERSION || "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const FACEBOOK_CONFIG = {
  appId: process.env.FACEBOOK_APP_ID || "",
  appSecret: process.env.FACEBOOK_APP_SECRET || "",
};

// ============================================
// Types
// ============================================

export interface FacebookAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookBusinessAccount {
  id: string;
  name: string;
  verification_status?: string;
}

export interface FacebookBusinessesResponse {
  data: FacebookBusinessAccount[];
}

export interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  status?: string;
}

export interface WhatsAppPhoneNumbersResponse {
  data: WhatsAppPhoneNumber[];
}

export interface WABAResponse {
  id: string;
  name: string;
}

export interface ExchangeResult {
  ok: boolean;
  accessToken?: string;
  expiresIn?: number;
  message?: string;
  details?: unknown;
}

export interface EmbeddedSignupParams {
  code: string;
  organizationId: string;
  wabaId?: string;
  phoneNumberId?: string;
  agentId?: string;
  unitId?: string;
}

export interface OAuthCallbackParams {
  code: string;
  redirectUri: string;
  organizationId: string;
  agentId?: string;
  unitId?: string;
}

// ============================================
// Token Exchange Functions
// ============================================

/**
 * Para Tech Provider Embedded Signup - NÃO usar redirect_uri
 * A Meta especifica que o code do FB.login() com config_id não precisa de redirect_uri
 */
export async function exchangeCodeForTokenEmbedded(code: string): Promise<ExchangeResult> {
  const { appId, appSecret } = FACEBOOK_CONFIG;

  if (!appId || !appSecret) {
    return {
      ok: false,
      message: "Missing Facebook app credentials (FACEBOOK_APP_ID or FACEBOOK_APP_SECRET)",
    };
  }

  console.log(`[EmbeddedSignup] Exchanging code for token (Embedded Signup - NO redirect_uri)`);
  console.log(`[EmbeddedSignup] client_id: ${appId}`);
  console.log(`[EmbeddedSignup] code: ${code.substring(0, 20)}...`);

  try {
    const url = `${GRAPH_API_BASE}/oauth/access_token?` +
      `client_id=${encodeURIComponent(appId)}&` +
      `client_secret=${encodeURIComponent(appSecret)}&` +
      `code=${encodeURIComponent(code)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as FacebookAccessTokenResponse & { error?: { message: string } };

    if (!response.ok || data.error) {
      const details = data.error ?? data;
      const message = data.error?.message || `Failed to exchange code (HTTP ${response.status})`;
      console.error(`[EmbeddedSignup] Token exchange failed:`, details);
      return { ok: false, message, details };
    }

    console.log(`[EmbeddedSignup] Token exchange successful`);
    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during token exchange";
    console.error(`[EmbeddedSignup] Token exchange exception:`, error);
    return { ok: false, message };
  }
}

/**
 * Para OAuth clássico - USA redirect_uri
 * Usado quando há redirect do Facebook OAuth tradicional
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<ExchangeResult> {
  const { appId, appSecret } = FACEBOOK_CONFIG;

  if (!appId || !appSecret) {
    return {
      ok: false,
      message: "Missing Facebook app credentials (FACEBOOK_APP_ID or FACEBOOK_APP_SECRET)",
    };
  }

  console.log(`[EmbeddedSignup] Exchanging code for token (OAuth with redirect_uri)`);
  console.log(`[EmbeddedSignup] client_id: ${appId}`);
  console.log(`[EmbeddedSignup] redirect_uri: ${redirectUri}`);
  console.log(`[EmbeddedSignup] code: ${code.substring(0, 20)}...`);

  try {
    const url = `${GRAPH_API_BASE}/oauth/access_token?` +
      `client_id=${encodeURIComponent(appId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${encodeURIComponent(appSecret)}&` +
      `code=${encodeURIComponent(code)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as FacebookAccessTokenResponse & { error?: { message: string } };

    if (!response.ok || data.error) {
      const details = data.error ?? data;
      const message = data.error?.message || `Failed to exchange code (HTTP ${response.status})`;
      console.error(`[EmbeddedSignup] Token exchange failed:`, details);
      return { ok: false, message, details };
    }

    console.log(`[EmbeddedSignup] Token exchange successful`);
    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during token exchange";
    console.error(`[EmbeddedSignup] Token exchange exception:`, error);
    return { ok: false, message };
  }
}

/**
 * Troca um token de curta duração por um long-lived token
 */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<ExchangeResult> {
  const { appId, appSecret } = FACEBOOK_CONFIG;

  if (!appId || !appSecret) {
    return {
      ok: false,
      message: "Missing Facebook app credentials",
    };
  }

  console.log(`[EmbeddedSignup] Exchanging for long-lived token`);

  try {
    const url = `${GRAPH_API_BASE}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${encodeURIComponent(appId)}&` +
      `client_secret=${encodeURIComponent(appSecret)}&` +
      `fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as FacebookAccessTokenResponse & { error?: { message: string } };

    if (!response.ok || data.error) {
      const details = data.error ?? data;
      const message = data.error?.message || `Failed to exchange token (HTTP ${response.status})`;
      return { ok: false, message, details };
    }

    console.log(`[EmbeddedSignup] Long-lived token exchange successful`);
    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during token exchange";
    return { ok: false, message };
  }
}

// ============================================
// Meta API Helper Functions
// ============================================

/**
 * Busca os negócios (businesses) do usuário autenticado
 */
export async function fetchUserBusinesses(accessToken: string): Promise<FacebookBusinessAccount[]> {
  console.log(`[EmbeddedSignup] Fetching user businesses...`);

  try {
    const url = `${GRAPH_API_BASE}/me/businesses?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as FacebookBusinessesResponse & { error?: { message: string } };

    if (!response.ok) {
      console.error(`[EmbeddedSignup] Failed to fetch businesses:`, data.error);
      throw new Error(data.error?.message || "Failed to fetch businesses");
    }

    const businesses = data.data || [];
    console.log(`[EmbeddedSignup] Found ${businesses.length} businesses`);
    return businesses;
  } catch (error) {
    console.error(`[EmbeddedSignup] Error fetching businesses:`, error);
    throw error;
  }
}

/**
 * Busca as contas WhatsApp Business (WABAs) de um negócio
 */
export async function fetchWABAs(businessId: string, accessToken: string): Promise<WABAResponse[]> {
  console.log(`[EmbeddedSignup] Fetching WABAs for business ${businessId}...`);

  try {
    const url = `${GRAPH_API_BASE}/${businessId}/owned_whatsapp_business_accounts?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as { data: WABAResponse[]; error?: { message: string } };

    if (!response.ok) {
      console.error(`[EmbeddedSignup] Failed to fetch WABAs:`, data.error);
      throw new Error(data.error?.message || "Failed to fetch WABAs");
    }

    const wabas = data.data || [];
    console.log(`[EmbeddedSignup] Found ${wabas.length} WABAs`);
    return wabas;
  } catch (error) {
    console.error(`[EmbeddedSignup] Error fetching WABAs:`, error);
    throw error;
  }
}

/**
 * Busca os números de telefone de uma WABA
 */
export async function fetchPhoneNumbers(wabaId: string, accessToken: string): Promise<WhatsAppPhoneNumber[]> {
  console.log(`[EmbeddedSignup] Fetching phone numbers for WABA ${wabaId}...`);

  try {
    const url = `${GRAPH_API_BASE}/${wabaId}/phone_numbers?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as WhatsAppPhoneNumbersResponse & { error?: { message: string } };

    if (!response.ok) {
      console.error(`[EmbeddedSignup] Failed to fetch phone numbers:`, data.error);
      return [];
    }

    const phones = data.data || [];
    console.log(`[EmbeddedSignup] Found ${phones.length} phone numbers`);
    return phones;
  } catch (error) {
    console.error(`[EmbeddedSignup] Error fetching phone numbers:`, error);
    return [];
  }
}

/**
 * Busca informações de um número de telefone específico
 */
export async function fetchPhoneNumberInfo(phoneNumberId: string, accessToken: string): Promise<WhatsAppPhoneNumber | null> {
  console.log(`[EmbeddedSignup] Fetching phone number info for ${phoneNumberId}...`);

  try {
    const url = `${GRAPH_API_BASE}/${phoneNumberId}?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json() as WhatsAppPhoneNumber & { error?: { message: string } };

    if (!response.ok) {
      console.error(`[EmbeddedSignup] Failed to fetch phone number info:`, data.error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`[EmbeddedSignup] Error fetching phone number info:`, error);
    return null;
  }
}

/**
 * Busca o ID do primeiro negócio do usuário (convenience function)
 */
export async function fetchFirstBusinessId(accessToken: string): Promise<string | null> {
  try {
    const businesses = await fetchUserBusinesses(accessToken);
    return businesses[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Busca informações completas do WhatsApp (WABA + telefones)
 * Útil quando recebemos waba_id do frontend e precisamos buscar detalhes
 */
export async function fetchWhatsAppInfo(
  wabaId: string,
  accessToken: string
): Promise<{
  waba: WABAResponse | null;
  phoneNumbers: WhatsAppPhoneNumber[];
}> {
  console.log(`[EmbeddedSignup] Fetching WhatsApp info for WABA ${wabaId}...`);

  try {
    // Buscar WABA info
    const wabaUrl = `${GRAPH_API_BASE}/${wabaId}?access_token=${encodeURIComponent(accessToken)}`;
    const wabaResponse = await fetch(wabaUrl, {
      headers: { "Accept": "application/json" },
    });
    const waba = await wabaResponse.json() as WABAResponse & { error?: unknown };

    if (waba.error) {
      console.error(`[EmbeddedSignup] Failed to fetch WABA info:`, waba.error);
      return { waba: null, phoneNumbers: [] };
    }

    // Buscar telefones
    const phoneNumbers = await fetchPhoneNumbers(wabaId, accessToken);

    return { waba, phoneNumbers };
  } catch (error) {
    console.error(`[EmbeddedSignup] Error fetching WhatsApp info:`, error);
    return { waba: null, phoneNumbers: [] };
  }
}

// ============================================
// Validation Functions
// ============================================

/**
 * Valida um token de acesso
 */
export async function validateAccessToken(accessToken: string): Promise<{
  valid: boolean;
  data?: unknown;
  error?: string;
}> {
  const { appId, appSecret } = FACEBOOK_CONFIG;

  if (!appId || !appSecret) {
    return { valid: false, error: "Missing app credentials" };
  }

  try {
    const url = `${GRAPH_API_BASE}/debug_token?` +
      `input_token=${encodeURIComponent(accessToken)}&` +
      `access_token=${encodeURIComponent(appId)}|${encodeURIComponent(appSecret)}`;

    const response = await fetch(url);
    const data = await response.json() as { data?: { is_valid: boolean }; error?: unknown };

    const isValid = data.data?.is_valid ?? false;
    return { valid: isValid, data: data.data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { valid: false, error: errorMessage };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Formata um número de telefone (remove caracteres não numéricos)
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Mapeia o quality rating da Meta para o formato do schema
 */
export function mapQualityRating(rating?: string): "GREEN" | "YELLOW" | "RED" | "UNKNOWN" {
  if (!rating) return "UNKNOWN";
  const upper = rating.toUpperCase();
  if (upper === "GREEN" || upper === "YELLOW" || upper === "RED") {
    return upper;
  }
  return "UNKNOWN";
}

/**
 * Calcula a data de expiração do token
 */
export function calculateTokenExpiry(expiresIn?: number): Date | undefined {
  if (!expiresIn) return undefined;
  return new Date(Date.now() + expiresIn * 1000);
}
