import { useQuery } from '@tanstack/react-query'
import { buildSearchCorpus } from '@/features/search/lib/searchCorpus'

/**
 * Lazily fetches + caches the full search corpus. `enabled` is controlled by
 * the caller (`useGlobalSearch`) so the corpus is only ever built once the
 * user actually interacts with search — never blocking a route's initial load.
 */
export function useSearchCorpusQuery(options: { enabled: boolean }) {
  return useQuery({
    queryKey: ['search-corpus'],
    queryFn: buildSearchCorpus,
    staleTime: 5 * 60_000,
    enabled: options.enabled,
  })
}
