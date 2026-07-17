import { useEffect, useState, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnvlToaster } from '@/shared/components/ui/AnvlToaster'
import {
  invalidateStorefrontPublication,
  registerStorefrontPublicationInvalidator,
} from '@/features/cms/hooks/invalidateStorefrontPublication'

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
    return () => {
      unregStorefront()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* The forged-plate toast system (see AnvlToaster for the design
          contract; positioning rationale RESP-11 lives there too). */}
      <AnvlToaster />
    </QueryClientProvider>
  )
}
