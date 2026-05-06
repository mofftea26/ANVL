import { useQuery } from '@tanstack/react-query'
import { runtimeClients } from '@/app/config/runtime'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => runtimeClients.commerce.getProducts(),
  })
}
