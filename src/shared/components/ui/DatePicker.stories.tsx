import type { Meta, StoryObj } from '@storybook/react-vite'
import { DatePicker } from './DatePicker'

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: {
    onChange: () => {},
    maxDate: new Date('2026-07-10'),
  },
}
export default meta

type Story = StoryObj<typeof DatePicker>

export const Empty: Story = {
  args: { placeholder: 'Select date' },
}

export const WithValue: Story = {
  args: { value: '1998-04-12' },
}

export const Disabled: Story = {
  args: { value: '1998-04-12', disabled: true },
}
