import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().optional(),
  preferredProduct: z.string().optional(),
})

export type WaitlistValues = z.infer<typeof waitlistSchema>

export function useWaitlistForm() {
  return useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
      firstName: '',
      preferredProduct: '',
    },
  })
}
