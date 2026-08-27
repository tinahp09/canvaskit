import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../packages/react/src/**/*.stories.@(ts|tsx)',
  ],
  framework: '@storybook/react-vite',
}

export default config
