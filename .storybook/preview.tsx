import type { Preview } from '@storybook/react-vite'
import { DesignSystemPreviewProvider } from '../src/shared/devPreview/DesignSystemPreviewProvider'
import '../src/styles.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        'oath-dark': { name: 'oath-dark', value: '#0B0B0C' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'oath-dark' },
  },
  // Same wrapper used by the design-sync preview build (cfg.provider) — a few
  // components (ProductCard, SafeLink's internal-link branch) render
  // TanStack Router's <Link>, which throws outside a router context.
  decorators: [
    (Story) => (
      <DesignSystemPreviewProvider>
        <Story />
      </DesignSystemPreviewProvider>
    ),
  ],
}

export default preview
