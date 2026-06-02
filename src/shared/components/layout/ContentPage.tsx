import type { ReactNode } from 'react'
import { PageHero } from '@/shared/components/premium/PageHero'
import { ContentPanel } from '@/shared/components/premium/ContentPanel'
import { SectionShell } from '@/shared/components/premium/SectionShell'

export function ContentPage({
  title,
  intro,
  eyebrow,
  children,
}: {
  title: string
  intro: string
  eyebrow?: string
  children?: ReactNode
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      {children ? (
        <SectionShell narrow>
          <ContentPanel>{children}</ContentPanel>
        </SectionShell>
      ) : null}
    </>
  )
}
