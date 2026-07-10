import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  args: {
    placeholder: 'Separate paragraphs with a blank line.',
    rows: 4,
  },
}
export default meta

type Story = StoryObj<typeof Textarea>

export const Comfortable: Story = {
  args: { density: 'comfortable' },
}

export const Compact: Story = {
  args: { density: 'compact', rows: 6 },
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'An oath is not spoken. It is carved. Every rep is a strike of the chisel — in silence, with no audience.',
  },
}
