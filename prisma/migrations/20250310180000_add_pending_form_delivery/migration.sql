-- CreateEnum
CREATE TYPE "PendingFormDeliveryStatus" AS ENUM ('WAITING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pending_form_deliveries" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfFilename" TEXT NOT NULL,
    "mediaId" TEXT,
    "templateName" TEXT NOT NULL,
    "templateLanguage" TEXT NOT NULL DEFAULT 'pt_BR',
    "leadName" TEXT,
    "leadEmail" TEXT,
    "dossieId" TEXT,
    "alunoId" TEXT,
    "status" "PendingFormDeliveryStatus" NOT NULL DEFAULT 'WAITING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "reprocessedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "lastErrorAt" TIMESTAMP(3),

    CONSTRAINT "pending_form_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_form_deliveries_messageId_key" ON "pending_form_deliveries"("messageId");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_messageId_idx" ON "pending_form_deliveries"("messageId");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_organizationId_idx" ON "pending_form_deliveries"("organizationId");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_status_idx" ON "pending_form_deliveries"("status");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_expiresAt_idx" ON "pending_form_deliveries"("expiresAt");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_dossieId_idx" ON "pending_form_deliveries"("dossieId");

-- CreateIndex
CREATE INDEX "pending_form_deliveries_createdAt_idx" ON "pending_form_deliveries"("createdAt");

-- AddForeignKey
ALTER TABLE "pending_form_deliveries" ADD CONSTRAINT "pending_form_deliveries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_form_deliveries" ADD CONSTRAINT "pending_form_deliveries_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "whatsapp_cloud_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
