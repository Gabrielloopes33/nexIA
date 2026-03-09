"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

interface InstagramConnectButtonProps {
  organizationId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function InstagramConnectButton({
  organizationId,
  onSuccess,
  onError,
}: InstagramConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Get auth URL from API
      const url = new URL("/api/instagram/auth", window.location.origin);
      if (organizationId) {
        url.searchParams.set("organizationId", organizationId);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get authorization URL");
      }

      // Redirect to Facebook OAuth
      window.location.href = data.data.authUrl;

      onSuccess?.();
    } catch (error) {
      console.error("[Instagram Connect] Error:", error);
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white"
    >
      <Instagram className="h-4 w-4 mr-2" />
      {isLoading ? "Conectando..." : "Conectar Instagram"}
    </Button>
  );
}
