import type { Meta, StoryObj } from '@storybook/react-vite'
import { FormField } from './FormField'
import { Input } from './Input'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
}
export default meta

type Story = StoryObj<typeof FormField>

export const Display: Story = {
  args: {
    label: 'Email',
    htmlFor: 'story-email',
    labelStyle: 'display',
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="story-email" placeholder="you@company.com" />
    </FormField>
  ),
}

export const Stacked: Story = {
  args: {
    label: 'Title',
    htmlFor: 'story-title',
    labelStyle: 'stacked',
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="story-title" density="compact" defaultValue="Act 1" />
    </FormField>
  ),
}

export const WithHint: Story = {
  args: {
    label: 'Slug',
    htmlFor: 'story-slug',
    hint: 'Used in /story?chapter=… deep links.',
    labelStyle: 'stacked',
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="story-slug" density="compact" defaultValue="the-oath" />
    </FormField>
  ),
}

export const WithError: Story = {
  args: {
    label: 'Email',
    htmlFor: 'story-email-error',
    error: 'Enter a valid email address.',
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="story-email-error" defaultValue="not-an-email" />
    </FormField>
  ),
}
