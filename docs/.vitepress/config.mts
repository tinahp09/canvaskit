import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CanvasKit',
  description: 'A TypeScript-first engine for interactive visual editors on an infinite canvas.',
  cleanUrls: true,
  // Planning and design artifacts remain in the repository, but are not part
  // of the publishable documentation surface.
  srcExclude: ['superpowers/**'],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'API reference', link: '/api/core' },
      { text: 'Examples', link: '/examples' },
    ],
    sidebar: {
      '/api/': [
        {
          text: 'API reference',
          items: [
            { text: 'Geometry', link: '/api/geometry' },
            { text: 'Core', link: '/api/core' },
            { text: 'Canvas renderer', link: '/api/canvas' },
            { text: 'SVG renderer', link: '/api/svg' },
            { text: 'Official plugins', link: '/api/plugins' },
            { text: 'React', link: '/api/react' },
            { text: 'Vue', link: '/api/vue' },
          ],
        },
      ],
      '/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/getting-started' },
            { text: 'Examples', link: '/examples' },
            { text: 'Performance', link: '/performance' },
            { text: 'Plugins', link: '/plugins' },
            { text: 'Frameworks', link: '/frameworks' },
            { text: 'Nuxt and SSR', link: '/nuxt' },
            { text: 'Migrations', link: '/migrations' },
          ],
        },
        {
          text: 'Release readiness',
          items: [
            { text: 'API stability', link: '/api-stability' },
            { text: 'Release quality gates', link: '/release-quality' },
            { text: 'V1 RC checklist', link: '/release-candidate-checklist' },
            { text: 'Release checklist', link: '/release-checklist' },
            { text: 'RC feedback', link: '/rc-feedback' },
          ],
        },
      ],
    },
    search: { provider: 'local' },
  },
})
