import { useEffect, useState, type PropsWithChildren } from 'react'
import { IconContext } from '@phosphor-icons/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnvlToaster } from '@/shared/components/ui/AnvlToaster'
import { PHOSPHOR_ICON_WEIGHT } from '@/shared/icons'
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
      {/* Global Phosphor weight (see @/shared/icons — the reversible icon
          seam; flip PHOSPHOR_ICON_WEIGHT to retune the whole site). */}
      <IconContext.Provider value={{ weight: PHOSPHOR_ICON_WEIGHT }}>
        {children}
        {/* The forged-plate toast system (see AnvlToaster for the design
            contract; positioning rationale RESP-11 lives there too). */}
        <AnvlToaster />
      </IconContext.Provider>
    </QueryClientProvider>
  )
}
