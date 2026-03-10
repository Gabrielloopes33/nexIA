/**
 * Instagram API Configuration
 */

export const config = {
  // Meta App credentials (suporta ambos os formatos de variável)
  appId: process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || process.env.VITE_META_APP_ID || "",
  appSecret: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "",
  
  // OAuth redirect URI
  redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 
    (process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/auth/callback`
      : "http://localhost:3000/api/instagram/auth/callback"),
  
  // Required OAuth scopes
  scopes: [
    "instagram_basic",
    "instagram_manage_messages",
    "instagram_manage_insights",
    "pages_read_engagement",
    "pages_manage_metadata",
  ],
  
  // Webhook verify token
  webhookVerifyToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "",
  
  // Graph API version
  graphApiVersion: "v18.0",
};

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.appId) {
    errors.push("FACEBOOK_APP_ID is required");
  }
  
  if (!config.appSecret) {
    errors.push("FACEBOOK_APP_SECRET is required");
  }
  
  if (!config.redirectUri) {
    errors.push("INSTAGRAM_REDIRECT_URI or NEXT_PUBLIC_APP_URL is required");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
