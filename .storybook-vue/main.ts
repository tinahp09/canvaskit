import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../packages/vue/src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/vue3-vite',
}

export default config
