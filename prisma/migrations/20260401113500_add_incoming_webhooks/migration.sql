-- CreateTable
CREATE TABLE "IncomingWebhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channelId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "botUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomingWebhook_botUserId_key" ON "IncomingWebhook"("botUserId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingWebhook_tokenHash_key" ON "IncomingWebhook"("tokenHash");

-- CreateIndex
CREATE INDEX "IncomingWebhook_channelId_idx" ON "IncomingWebhook"("channelId");

-- CreateIndex
CREATE INDEX "IncomingWebhook_createdById_idx" ON "IncomingWebhook"("createdById");

-- AddForeignKey
ALTER TABLE "IncomingWebhook" ADD CONSTRAINT "IncomingWebhook_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingWebhook" ADD CONSTRAINT "IncomingWebhook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingWebhook" ADD CONSTRAINT "IncomingWebhook_botUserId_fkey" FOREIGN KEY ("botUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
