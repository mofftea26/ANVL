import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccordionDisclosure } from './AccordionDisclosure'

const meta: Meta<typeof AccordionDisclosure> = {
  title: 'Components/AccordionDisclosure',
  component: AccordionDisclosure,
  args: {
    title: 'How do I find my size?',
    children: 'Check the Size Guide for full chest, waist, and length measurements per piece.',
  },
}
export default meta

type Story = StoryObj<typeof AccordionDisclosure>

export const Default: Story = {}

export const Stack: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <AccordionDisclosure title="Shipping">Ships within Lebanon in 2–4 business days.</AccordionDisclosure>
      <AccordionDisclosure title="Returns">Unworn pieces returnable within 14 days.</AccordionDisclosure>
      <AccordionDisclosure title="Care">Cold wash, hang dry, no bleach.</AccordionDisclosure>
    </div>
  ),
}
