import { useTrackPageView } from '@/features/analytics/hooks/useTrackPageView'

export function RouteAnalytics() {
  useTrackPageView()
  return null
}
