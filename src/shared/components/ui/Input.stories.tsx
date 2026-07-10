import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: { placeholder: 'you@company.com' },
}
export default meta

type Story = StoryObj<typeof Input>

export const Comfortable: Story = {
  args: { density: 'comfortable' },
}

export const Compact: Story = {
  args: { density: 'compact', placeholder: 'Search library…' },
}

export const WithValue: Story = {
  args: { defaultValue: 'ANVL Oversized Tee' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked field' },
}
