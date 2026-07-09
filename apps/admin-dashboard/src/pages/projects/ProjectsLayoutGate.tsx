/**
 * ProjectsLayoutGate — per-tenant projects layout selection.
 *
 * The tenant's `features.projectsLayout` (company settings, seed-only) picks
 * which projects UI this company sees. Today every tenant (KASE, Orrix, US
 * demo) uses 'standard'; when Orrix's divergent structure is designed, add its
 * components to VARIANTS under a new key and flip the flag in their company
 * row — no other code changes.
 *
 * Unknown/missing flag values fall back to 'standard' (fail-open, same rule
 * as isFeatureEnabled).
 */
import { useCompanySettings } from '../../hooks/useCompanySettings'
import StandardProjects from './Projects'
import StandardProjectDetail from './ProjectDetail'

type LayoutKey = 'standard'

const VARIANTS: Record<LayoutKey, { List: React.ComponentType; Detail: React.ComponentType }> = {
  standard: { List: StandardProjects, Detail: StandardProjectDetail },
}

function useProjectsLayout(): LayoutKey {
  const { data } = useCompanySettings()
  const flag = data?.features?.['projectsLayout']
  return typeof flag === 'string' && flag in VARIANTS ? (flag as LayoutKey) : 'standard'
}

export function ProjectsPage() {
  const { List } = VARIANTS[useProjectsLayout()]
  return <List />
}

export function ProjectDetailPage() {
  const { Detail } = VARIANTS[useProjectsLayout()]
  return <Detail />
}
