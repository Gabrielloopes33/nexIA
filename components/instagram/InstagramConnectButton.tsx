"use client";

import { InstagramEmbeddedSignup } from "./InstagramEmbeddedSignup";

interface InstagramConnectButtonProps {
  organizationId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Instagram Connect Button
 * Uses Facebook Embedded Signup flow (same as WhatsApp)
 * 
 * @deprecated Use InstagramEmbeddedSignup directly for more control
 */
export function InstagramConnectButton({
  onSuccess,
  onError,
}: InstagramConnectButtonProps) {
  const handleSuccess = () => {
    onSuccess?.();
  };

  const handleError = (error: string) => {
    onError?.(new Error(error));
  };

  return (
    <InstagramEmbeddedSignup
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}

export { InstagramEmbeddedSignup };
