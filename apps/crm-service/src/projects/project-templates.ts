/**
 * Registry of selectable Project templates. Deliberately NOT a DB enum — adding a
 * new template is a code change here, not a migration. See
 * docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md.
 */
export const PROJECT_TEMPLATES = ['STANDARD', 'HOUSING_SCHEME'] as const;
export type ProjectTemplateType = (typeof PROJECT_TEMPLATES)[number];

export function isValidTemplateType(value: string): value is ProjectTemplateType {
  return (PROJECT_TEMPLATES as readonly string[]).includes(value);
}
