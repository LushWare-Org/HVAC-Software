/**
 * What happened in a conversation, for whoever needs to react: the socket
 * gateway (live updates) and the notifier (push). Keeps the service free of
 * transport details and easy to test.
 */
import { Injectable } from '@nestjs/common';
import type { ConvLike } from './chat.policy';

export interface ConvRef extends ConvLike {
  id: string;
  title?: string | null;
  customerName?: string | null;
  lastSeq: number;
}

export type ChatEvent =
  | { type: 'message'; conv: ConvRef; message: ShapedMessage }
  | { type: 'message_updated'; conv: ConvRef; message: ShapedMessage }
  | { type: 'read'; conv: ConvRef; memberKey: string; seq: number }
  | { type: 'conversation'; conv: ConvRef }
  /** A message also went out (or failed to go out) on another channel, e.g. Telegram. */
  | { type: 'delivery'; conv: ConvRef; messageId: string; channel: 'telegram'; status: 'sent' | 'failed' };

export interface ShapedMessage {
  id: string;
  conversationId: string;
  seq: number;
  senderKind: string;
  senderMemberKey: string;
  senderUserId: string | null;
  senderName: string;
  senderRole: string | null;
  body: string;
  attachments: unknown;
  jobId: string | null;
  jobNumber: string | null;
  clientId: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ChatBus {
  private readonly listeners = new Set<(e: ChatEvent) => void>();

  on(fn: (e: ChatEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  publish(e: ChatEvent): void {
    for (const fn of this.listeners) {
      try { fn(e); } catch { /* one listener failing must not stop the others */ }
    }
  }
}
