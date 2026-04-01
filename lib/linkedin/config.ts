/**
 * LinkedIn OAuth 2.0 Configuration
 */

export const linkedInConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',

  redirectUri:
    process.env.LINKEDIN_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/auth/callback`
      : 'http://localhost:3000/api/integrations/linkedin/auth/callback'),

  // Scopes básicos (Sign In with LinkedIn) — já aprovados automaticamente
  scopes: [
    'openid',
    'profile',
    'email',
  ],

  // Scopes de Advertising + Lead Sync — ativar apenas após aprovação do LinkedIn
  adsScopes: [
    'r_ads',
    'r_ads_leadgen_automation',
  ],

  webhookVerifyToken:
    process.env.LINKEDIN_WEBHOOK_VERIFY_TOKEN || 'nexia-linkedin-verify',
}
