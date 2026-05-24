import { useEffect, useState, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import {
  invalidateStorefrontPublication,
  registerStorefrontPublicationInvalidator,
} from '@/features/cms/hooks/invalidateStorefrontPublication'
import {
  invalidateAdminDropsList,
  registerAdminDropsListInvalidator,
} from '@/features/admin/cmsRemote/invalidateAdminDropsList'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  useEffect(() => {
    const unregStorefront = registerStorefrontPublicationInvalidator(() =>
      invalidateStorefrontPublication(queryClient),
    )
    const unregDrops = registerAdminDropsListInvalidator(() =>
      invalidateAdminDropsList(queryClient),
    )
    return () => {
      unregStorefront()
      unregDrops()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/*
        RESP-11 — bottom-center reads well on mobile (doesn't fight the
        sticky header) and on desktop (sits above the fold without
        obscuring primary chrome). `mobileOffset` raises the toast above
        the iPhone home indicator + the PDP sticky purchase bar.
      */}
      <Toaster
        richColors
        position="bottom-center"
        offset={16}
        mobileOffset={{ bottom: 96 }}
      />
    </QueryClientProvider>
  )
}
