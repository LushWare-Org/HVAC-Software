export interface DescribedAction {
  action: string;
  description: string;
}

export type ActionTemplateFn = (reqBody: any, resBody: any) => DescribedAction;

/** Keyed by `METHOD route-pattern`, e.g. `"POST /jobs"`, `"PATCH /jobs/:id/status"`. */
export type ActionTemplateMap = Record<string, ActionTemplateFn>;
