import type { Meta, StoryObj } from '@storybook/react-vite'
import { Container } from './Container'

const meta: Meta<typeof Container> = {
  title: 'Components/Container',
  component: Container,
}
export default meta

type Story = StoryObj<typeof Container>

export const Default: Story = {
  render: () => (
    <div className="w-full bg-[var(--color-surface)]">
      <Container className="border-x border-dashed border-[var(--color-line)] py-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          Content centered at --anvl-content-max, widening at 2xl.
        </p>
      </Container>
    </div>
  ),
}
