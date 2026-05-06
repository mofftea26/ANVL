import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { runtimeClients } from '@/app/config/runtime'

export function useTrackPageView() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    runtimeClients.analytics.trackPageView({ path: pathname })
  }, [pathname])
}
