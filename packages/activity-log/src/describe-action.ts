import type { ActivityLogService } from '@tscrm/types';
import type { ActionTemplateMap, DescribedAction } from './templates/types';
import { crmTemplates } from './templates/crm';
import { jobsTemplates } from './templates/jobs';
import { financeTemplates } from './templates/finance';
import { commsTemplates } from './templates/comms';

// scheduling-service is written in Go and can't import this TS package, so
// it narrates its own events directly in
// apps/scheduling-service/internal/activitylog/middleware.go rather than
// going through this registry — there's deliberately no `scheduling` entry
// here to avoid two descriptions of the same events silently diverging.
const REGISTRY: Partial<Record<ActivityLogService, ActionTemplateMap>> = {
  crm: crmTemplates,
  jobs: jobsTemplates,
  finance: financeTemplates,
  comms: commsTemplates,
};

const METHOD_VERBS: Record<string, string> = {
  GET: 'Viewed',
  POST: 'Created',
  PATCH: 'Updated',
  PUT: 'Updated',
  DELETE: 'Removed',
};

/**
 * Turns a route pattern into a plain noun phrase — strips path-param
 * placeholders (`:id`) and separators so "/inventory/items/:id" reads as
 * "inventory items", never as something that looks like a URL.
 */
function humanizeRoute(routePattern: string): string {
  const words = routePattern
    .split('/')
    .filter((seg) => seg && !seg.startsWith(':'))
    .join(' ')
    .replace(/[-_]/g, ' ')
    .trim();
  return words || 'a record';
}

/**
 * Looks up a human-readable description for a route in the per-service
 * template registry. Every route gets logged regardless — an untemplated
 * route (or a template that throws on unexpected input) falls back to a
 * plain-English sentence built from the HTTP verb and route, so the super
 * admin dashboard NEVER shows raw method/path text for any event.
 */
export function describeAction(
  service: ActivityLogService,
  method: string,
  routePattern: string,
  reqBody: unknown,
  resBody: unknown,
): DescribedAction {
  const key = `${method.toUpperCase()} ${routePattern}`;
  const fn = REGISTRY[service]?.[key];
  if (fn) {
    try {
      return fn(reqBody, resBody);
    } catch {
      // fall through to generic fallback below
    }
  }
  const verb = METHOD_VERBS[method.toUpperCase()] ?? 'Performed an action on';
  return { action: 'http.request', description: `${verb} ${humanizeRoute(routePattern)}` };
}
