import { useEffect, useState, type ReactNode } from 'react'
import { PassportSheet } from '@/features/passport/components/PassportSheet'
import { Modal } from '@/shared/components/ui/Modal'

/**
 * Device-appropriate overlay for armory surfaces: a centred modal on desktop,
 * a bottom sheet on phones — same content, one API.
 */
export function ArmoryOverlay({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        // Fixed height: the frame never resizes with content — sparse states
        // show their designed empty state instead of a collapsed sliver.
        className="h-[72svh] max-w-2xl overflow-y-auto"
      >
        {children}
      </Modal>
    )
  }
  return open ? (
    <PassportSheet open onClose={onClose} title={title}>
      {children}
    </PassportSheet>
  ) : null
}
