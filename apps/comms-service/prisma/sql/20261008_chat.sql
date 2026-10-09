-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('CUSTOMER_OFFICE', 'CUSTOMER_TECH', 'TECH_OFFICE', 'STAFF_DIRECT', 'STAFF_GROUP');

-- CreateEnum
CREATE TYPE "ChatMemberKind" AS ENUM ('STAFF', 'CUSTOMER', 'OFFICE');

-- CreateEnum
CREATE TYPE "ChatSenderKind" AS ENUM ('STAFF', 'CUSTOMER', 'SYSTEM', 'KELVIN');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "ConversationKind" NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "title" TEXT,
    "pairKey" TEXT,
    "createdById" TEXT,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "lastSenderName" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "ChatMemberKind" NOT NULL,
    "memberKey" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "lastReadSeq" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "senderKind" "ChatSenderKind" NOT NULL,
    "senderMemberKey" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "jobId" TEXT,
    "jobNumber" TEXT,
    "clientId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_companyId_kind_customerId_idx" ON "Conversation"("companyId", "kind", "customerId");

-- CreateIndex
CREATE INDEX "Conversation_companyId_lastMessageAt_idx" ON "Conversation"("companyId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_companyId_pairKey_key" ON "Conversation"("companyId", "pairKey");

-- CreateIndex
CREATE INDEX "ChatMember_companyId_memberKey_idx" ON "ChatMember"("companyId", "memberKey");

-- CreateIndex
CREATE INDEX "ChatMember_companyId_customerId_idx" ON "ChatMember"("companyId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_conversationId_memberKey_key" ON "ChatMember"("conversationId", "memberKey");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_companyId_createdAt_idx" ON "ChatMessage"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_conversationId_seq_key" ON "ChatMessage"("conversationId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_conversationId_clientId_key" ON "ChatMessage"("conversationId", "clientId");

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

