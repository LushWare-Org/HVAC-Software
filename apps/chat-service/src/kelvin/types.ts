export type Urgency = 'urgent' | 'soon' | 'quiet';
export type Audience = 'dispatch' | 'money' | 'all';
export type KelvinKind = 'BRIEF' | 'LATE' | 'TECH_OFF' | 'GAP' | 'EMERGENCY_UNASSIGNED' | 'RESCHEDULE_REQUEST' | 'NOTICE';
export type SpeakMode = 'ALL' | 'URGENT_ONLY' | 'NEVER';

/** One way to deal with an item: asking Kelvin, who shows a confirm card. */
export interface KelvinFix { label: string; request: string }

/** Something Kelvin tells a person. ids are stable per real-world situation. */
export interface KelvinItem {
  id: string;
  kind: KelvinKind;
  urgency: Urgency;
  title: string;
  why?: string;
  fixes: KelvinFix[];
  anchor?: { page: 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance'; recordType?: 'job' | 'technician' | 'customer' | 'invoice'; recordId?: string };
  audience: Audience;
  createdAt: string;
  expiresAt?: string;
  /** From Kelvin's log, for this person. */
  spoken?: boolean;
  seen?: boolean;
}

export interface KelvinPrefs { speakMode: SpeakMode; quietUntil: string | null }

export interface KelvinFeed {
  items: KelvinItem[];
  /** Sources that failed this time, by name, so the desk can say what it couldn't check. */
  unavailable: string[];
  /** null when the person's settings could not be read: the dashboard then stays quiet. */
  prefs: KelvinPrefs | null;
  generatedAt: string;
}
