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

  // Scopes necessários para LinkedIn Ads + Lead Gen Forms
  scopes: [
    'profile',
    'email',
    'r_ads',
    'r_ads_leadgen_automation',
  ],

  webhookVerifyToken:
    process.env.LINKEDIN_WEBHOOK_VERIFY_TOKEN || 'nexia-linkedin-verify',
}
