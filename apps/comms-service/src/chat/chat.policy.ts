/**
 * Who may see and post in a conversation. The single rule every route, socket
 * join and broadcast goes through, so there is one place to get it right.
 *
 *   Customer   → only conversations about themselves (their office chat, and
 *                private chats with technicians who worked for them).
 *   Technician → only conversations they are a member of.
 *   Office     → every customer↔office and technician↔office conversation in
 *                the company (shared inbox), plus any they are a member of.
 * Nobody ever sees another company's conversations.
 */
import type { ConversationKind } from '../prisma/generated';

export const OFFICE_ROLES = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const SHARED_INBOX: ConversationKind[] = ['CUSTOMER_OFFICE', 'TECH_OFFICE'];

export interface Viewer {
  userId: string;
  companyId: string;
  role: string;
  name: string;
  customerId?: string | null;
}

export interface ConvLike {
  companyId: string;
  kind: ConversationKind;
  customerId?: string | null;
  members: Array<{ memberKey: string; leftAt?: Date | null }>;
}

export const isCustomer = (v: Viewer) => v.role.toLowerCase() === 'customer';
export const isOffice = (v: Viewer) => OFFICE_ROLES.includes(v.role.toLowerCase());
export const isTechnician = (v: Viewer) => v.role.toLowerCase() === 'technician';

export const customerKey = (customerId: string) => `customer:${customerId}`;
export const OFFICE_KEY = 'office';

/** The member row that represents this viewer in a conversation (whose read marker and mute apply). */
export function memberKeyFor(v: Viewer, conv: Pick<ConvLike, 'kind'>): string {
  if (isCustomer(v)) return customerKey(v.customerId ?? '');
  if (isOffice(v) && SHARED_INBOX.includes(conv.kind)) return OFFICE_KEY;
  return v.userId;
}

export function canView(v: Viewer, conv: ConvLike): boolean {
  if (!v.companyId || conv.companyId !== v.companyId) return false;
  const active = (key: string) => conv.members.some((m) => m.memberKey === key && !m.leftAt);
  if (isCustomer(v)) {
    if (!v.customerId || conv.customerId !== v.customerId) return false;
    return (conv.kind === 'CUSTOMER_OFFICE' || conv.kind === 'CUSTOMER_TECH') && active(customerKey(v.customerId));
  }
  if (isOffice(v) && SHARED_INBOX.includes(conv.kind)) return true;
  return active(v.userId);
}

/** Posting follows viewing; archived conversations can still be read but not written to. */
export function canPost(v: Viewer, conv: ConvLike & { archivedAt?: Date | null }): boolean {
  return canView(v, conv) && !conv.archivedAt;
}

/** How a message reads for this viewer: theirs (right side) or someone else's. */
export function isMine(v: Viewer, conv: Pick<ConvLike, 'kind'>, m: { senderMemberKey: string }): boolean {
  return m.senderMemberKey === memberKeyFor(v, conv);
}

/** Socket rooms a conversation's events go to. Only people allowed to see it are ever in them. */
export function audienceRooms(conv: ConvLike): string[] {
  const rooms = new Set<string>();
  if (SHARED_INBOX.includes(conv.kind)) rooms.add(`office:${conv.companyId}`);
  for (const m of conv.members) {
    if (m.leftAt) continue;
    if (m.memberKey === OFFICE_KEY) continue;
    if (m.memberKey.startsWith('customer:')) rooms.add(`c:${conv.companyId}:${m.memberKey.slice(9)}`);
    else rooms.add(`u:${m.memberKey}`);
  }
  return [...rooms];
}

/** The rooms a connected socket joins. Customers never join staff rooms. */
export function roomsForSocket(v: Viewer): string[] {
  if (isCustomer(v)) return v.customerId ? [`c:${v.companyId}:${v.customerId}`] : [];
  const rooms = [`u:${v.userId}`];
  if (isOffice(v)) rooms.push(`office:${v.companyId}`);
  return rooms;
}
