export type Urgency = 'urgent' | 'soon' | 'quiet'
export type SpeakMode = 'ALL' | 'URGENT_ONLY' | 'NEVER'
export interface KelvinFix { label: string; request: string }
export interface KelvinItem {
  id: string
  kind: 'BRIEF' | 'LATE' | 'TECH_OFF' | 'GAP' | 'EMERGENCY_UNASSIGNED' | 'RESCHEDULE_REQUEST' | 'NOTICE' | 'ROUTINE' | 'OVERDUE' | 'LOW_STOCK' | 'SUGGESTION'
  urgency: Urgency
  title: string
  why?: string
  fixes: KelvinFix[]
  anchor?: { page: 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance' | 'inventory'; recordType?: string; recordId?: string }
  audience: 'dispatch' | 'money' | 'all'
  createdAt: string
  expiresAt?: string
  spoken?: boolean
  seen?: boolean
}
export type Tone = 'FRIENDLY' | 'SHORT' | 'FORMAL'
export interface KelvinPrefs { speakMode: SpeakMode; quietUntil: string | null; tone?: Tone }
export interface MindNote { id: string; text: string; forEveryone: boolean; createdByName: string | null }
export interface MindRoutine { id: string; request: string; days: number[]; time: string }
export interface KelvinMind { notes: MindNote[]; routines: MindRoutine[] }
export interface KelvinFeed { items: KelvinItem[]; unavailable: string[]; prefs: KelvinPrefs | null; generatedAt: string }
export interface PageContext { page: string; label: string; filter?: string; record?: { type: string; id: string; label: string } }
export interface LogEntry { type: 'ACTION_DONE' | 'ACTION_FAILED' | 'SPOKE'; summary: string; action?: string; recordRef?: string; createdAt: string }
