-- CreateTable EvolutionInstance
CREATE TABLE "evolution_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "instance_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
    "phone_number" VARCHAR(50),
    "profile_picture_url" TEXT,
    "profile_name" VARCHAR(255),
    "api_key" VARCHAR(255),
    "webhook_enabled" BOOLEAN NOT NULL DEFAULT true,
    "webhook_url" TEXT,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "messages_received" INTEGER NOT NULL DEFAULT 0,
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolution_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evolution_instances_instance_name_key" ON "evolution_instances"("instance_name");

-- CreateIndex
CREATE INDEX "evolution_instances_organization_id_idx" ON "evolution_instances"("organization_id");

-- CreateIndex
CREATE INDEX "evolution_instances_status_idx" ON "evolution_instances"("status");
