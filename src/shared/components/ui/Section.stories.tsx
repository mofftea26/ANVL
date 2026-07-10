import type { Meta, StoryObj } from '@storybook/react-vite'
import { Section } from './Section'

const meta: Meta<typeof Section> = {
  title: 'Components/Section',
  component: Section,
}
export default meta

type Story = StoryObj<typeof Section>

export const Default: Story = {
  render: () => (
    <Section className="border border-dashed border-[var(--color-line)]">
      <p className="text-sm text-[var(--color-text-muted)]">
        Section content — vertical rhythm only, no horizontal constraint.
      </p>
    </Section>
  ),
}
