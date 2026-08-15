/**
 * prefetchRoutes.ts — route → data-prefetch map.
 *
 * Two consumers:
 *   1. Sidebar hover/focus — warms a page's data the moment the user aims
 *      at its nav item, so by click time both the JS chunk (ROUTE_LOADERS
 *      in App.tsx) and the data are already in cache.
 *   2. App idle warmup — after login, once the browser goes idle, every
 *      main page's data is prefetched in sequence so the FIRST visit to any
 *      page renders instantly too.
 *
 * All entries use dynamic import so this file adds nothing to the initial
 * bundle — importing a prefetcher also warms that page's code chunk, which
 * is exactly what we want.
 *
 * Every prefetcher goes through queryClient.prefetchQuery with the same
 * queryKey + queryFn as the page's own hooks, so it respects staleTime:
 * repeated calls while data is fresh cost zero network requests.
 */

export const DATA_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () =>
    Promise.allSettled([
      import('../hooks/useDashboard').then(m => m.prefetchDashboard()),
      import('../hooks/useAnalytics').then(m => m.prefetchDashboardCharts()),
      import('../pages/projects/componentsApi').then(m => m.prefetchOpenComponentIssues()),
    ]),
  '/customers':  () => import('../hooks/useCustomers').then(m => m.prefetchCustomersPage()),
  '/jobs':       () => import('../hooks/useJobs').then(m => m.prefetchJobsPage()),
  '/scheduling': () => import('../hooks/useScheduling').then(m => m.prefetchSchedulingPage()),
  '/projects':   () => import('../pages/projects/projectsApi').then(m => m.prefetchProjectsPage()),
  '/agreements': () => import('../hooks/useAgreements').then(m => m.prefetchAgreementsPage()),
  '/marketing':  () => import('../hooks/useMarketing').then(m => m.prefetchMarketingPage()),
}

const inFlight = new Set<string>()

/** Warm one route's data (deduped while a prefetch for it is running). */
export function prefetchRouteData(path: string): void {
  const fn = DATA_PREFETCHERS[path]
  if (!fn || inFlight.has(path)) return
  inFlight.add(path)
  fn().finally(() => inFlight.delete(path))
}

/**
 * Warm every registered route's data, one route at a time so we never
 * stampede the backend. Called once at idle after login.
 */
export async function warmAllRouteData(): Promise<void> {
  for (const path of Object.keys(DATA_PREFETCHERS)) {
    try {
      await DATA_PREFETCHERS[path]()
    } catch {
      // A failing service must never break the warmup chain.
    }
  }
}
