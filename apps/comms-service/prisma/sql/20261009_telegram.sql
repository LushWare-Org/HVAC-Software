-- Telegram add-on (comms schema). Only adds tables; nothing existing changes.

CREATE TABLE IF NOT EXISTS "TelegramBot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "botUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "tokenEnc" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mode" TEXT NOT NULL DEFAULT 'webhook',
    "pollOffset" BIGINT NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "connectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramBot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramBot_companyId_key" ON "TelegramBot"("companyId");

CREATE TABLE IF NOT EXISTS "TelegramLink" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "memberKind" TEXT NOT NULL,
    "memberKey" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "tgUsername" TEXT,
    "tgName" TEXT,
    "alsoPush" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),
    "unlinkReason" TEXT,
    CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLink_botId_chatId_key" ON "TelegramLink"("botId", "chatId");
CREATE INDEX IF NOT EXISTS "TelegramLink_companyId_memberKey_idx" ON "TelegramLink"("companyId", "memberKey");
CREATE INDEX IF NOT EXISTS "TelegramLink_companyId_customerId_idx" ON "TelegramLink"("companyId", "customerId");

CREATE TABLE IF NOT EXISTS "TelegramLinkCode" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "memberKind" TEXT NOT NULL,
    "memberKey" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramLinkCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLinkCode_codeHash_key" ON "TelegramLinkCode"("codeHash");
CREATE INDEX IF NOT EXISTS "TelegramLinkCode_companyId_memberKey_idx" ON "TelegramLinkCode"("companyId", "memberKey");

CREATE TABLE IF NOT EXISTS "TelegramDelivery" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "tgMessageId" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramDelivery_messageId_linkId_key" ON "TelegramDelivery"("messageId", "linkId");
CREATE INDEX IF NOT EXISTS "TelegramDelivery_messageId_idx" ON "TelegramDelivery"("messageId");
