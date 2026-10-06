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
}

/** What the person sees before confirming an action. */
export interface ActionPreview {
  /** Short imperative, e.g. "Reschedule JOB-0412". */
  title: string;
  /** Plain lines: what will change, from what to what. */
  lines: string[];
  /** Arguments to run with, resolved during the preview (ids, times). Defaults to the model's arguments. */
  args?: Record<string, unknown>;
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
  /** Write tools: look things up and describe the change. Throw to refuse with a reason the model can relay. */
  preview?: (args: Record<string, any>, ctx: AgentContext, http: ServiceHttp) => Promise<ActionPreview>;
  run: (args: Record<string, any>, ctx: AgentContext, http: ServiceHttp) => Promise<unknown>;
}

/** A refusal the person should see as-is ("That job is already completed."). */
export class ToolRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolRefusal';
  }
}
