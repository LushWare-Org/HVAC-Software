import type { BotType } from '../prompts/prompt.service';
import type { ServiceHttp } from './service-http';

/** Who is asking. Tools act as this user, so every service applies its own rules. */
export interface AgentContext {
  companyId: string;
  customerId?: string;
  userId: string;
  role: string;
  email: string;
  name?: string;
  /** Company IANA time zone, for reading and writing times. */
  timezone?: string;
  /** The caller's JWT, forwarded to the services. */
  token?: string;
  /** What the person typed in this conversation, so a price "they gave" can be checked against it. Absent at confirm. */
  said?: string;
}

/** What the person sees before confirming an action. */
export interface ActionPreview {
  /** Short imperative, e.g. "Reschedule JOB-0412". */
  title: string;
  /** Plain lines: what will change, from what to what. */
  lines: string[];
  /** Arguments to run with, resolved during the preview (ids, times). Defaults to the model's arguments. */
  args?: Record<string, unknown>;
  /** A plan's steps, shown on the card one by one with tick boxes. */
  steps?: Array<{ n: number; title: string; lines: string[]; sends?: string; dependsOn: number[] }>;
  /** Shown under a plan's steps: what was left out and why, and anything to watch for. */
  notes?: string[];
}

/** A step that undoes another: an (often internal) tool and its arguments. */
export interface ReverseStep { tool: string; args: Record<string, unknown>; title: string }

/** Lets a step's preview see records that earlier steps in the same plan will create. */
export interface PlanScope {
  /** The would-be record for a reference like "@1" or "@1.customerId", if an earlier step provides it. */
  pending(ref: string): Record<string, unknown> | undefined;
}

/** JSON schema for a tool's arguments, as the model sees it. */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  /** read: runs straight away. write: shown as a preview and runs only after the person confirms. */
  kind: 'read' | 'write';
  bots: BotType[];
  /** Roles allowed to use the tool. Omit for any signed-in user of the bot. */
  roles?: string[];
  /** Offered only to companies with Kelvin switched on (features.kelvin === true). */
  kelvinOnly?: boolean;
  /** Never offered to the model: used only by the plan engine, e.g. to undo a step. */
  internal?: boolean;
  /** What this step sends to a customer, shown with ✉ on the card. Sent things cannot be undone. */
  sends?: (args: Record<string, any>) => string | null;
  /** The record this step will create, so later steps in a plan can refer to it before it exists. */
  provides?: (args: Record<string, any>, preview: ActionPreview) => Record<string, unknown>;
  /** The parts of the prepared arguments that must not change between the card and the run (money, times). */
  signature?: (args: Record<string, any>) => unknown;
  /** The step that reverses this one, built after it ran. null when it can't be reversed. */
  reverse?: (args: Record<string, any>, result: any, ctx: AgentContext) => ReverseStep | null;
  /** Write tools: look things up and describe the change. Throw to refuse with a reason the model can relay. */
  preview?: (args: Record<string, any>, ctx: AgentContext, http: ServiceHttp, scope?: PlanScope) => Promise<ActionPreview>;
  run: (args: Record<string, any>, ctx: AgentContext, http: ServiceHttp) => Promise<unknown>;
}

/** A refusal the person should see as-is ("That job is already completed."). */
export class ToolRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolRefusal';
  }
}
