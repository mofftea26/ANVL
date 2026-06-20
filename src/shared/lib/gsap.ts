import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// GSAP plugins must only be registered on the client. TanStack Start
// renders this app on the server, so guard the registration to avoid
// touching window during SSR.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
