import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * Endpoint de health check para monitoramento
 */
export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
  };

  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    return NextResponse.json(
      {
        status: "healthy",
        checks,
      },
      { status: 200 }
    );
  } catch (error) {
    checks.database = false;

    return NextResponse.json(
      {
        status: "unhealthy",
        checks,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
