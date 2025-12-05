/**
 * VitePress Configuration
 * Modern documentation site for LitReview Pro
 */

import { defineConfig } from 'vitepress'
import { version } from '../../package.json'

export default defineConfig({
  title: 'LitReview Pro',
  description: 'AI-powered Literature Review Generator',
  lang: 'en-US',
  base: '/',

  // Theme configuration
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/configuration' },
      { text: 'Components', link: '/components/overview' },
      { text: 'Changelog', link: '/changelog' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is LitReview Pro?', link: '/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' }
        ]
      },
      {
        text: 'User Guide',
        items: [
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Literature Review Generation', link: '/guide/literature-review' },
          { text: 'Language Polish', link: '/guide/language-polish' },
          { text: 'Templates', link: '/guide/templates' },
          { text: 'Export Options', link: '/guide/export' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Configuration', link: '/api/configuration' },
          { text: 'LLM Providers', link: '/api/providers' },
          { text: 'Streaming API', link: '/api/streaming' },
          { text: 'WebSocket Events', link: '/api/websocket' }
        ]
      },
      {
        text: 'Components',
        items: [
          { text: 'Overview', link: '/components/overview' },
          { text: 'Design System', link: '/components/design-system' },
          { text: 'UI Components', link: '/components/ui-components' },
          { text: 'Hooks', link: '/components/hooks' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Project Structure', link: '/dev/structure' },
          { text: 'Development Setup', link: '/dev/setup' },
          { text: 'Building', link: '/dev/building' },
          { text: 'Testing', link: '/dev/testing' },
          { text: 'Contributing', link: '/dev/contributing' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/LitReview' }
    ],

    footer: {
      message: `Released under the MIT License.`,
      copyright: `Copyright © 2024-present LitReview Pro Team`
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/your-username/LitReview/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    carbonAds: {
      code: 'your-carbon-code',
      placement: 'your-carbon-placement'
    }
  },

  // Markdown configuration
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
    container: {
      tipLabel: 'TIP',
      warningLabel: 'WARNING',
      dangerLabel: 'DANGER',
      infoLabel: 'INFO',
      detailsLabel: 'Details'
    }
  },

  // Vite configuration
  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    },
    server: {
      host: true,
      port: 5173
    },
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 1000
    }
  },

  // Head configuration
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en-US' }],
    ['meta', { property: 'og:site_name', content: 'LitReview Pro' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }]
  ]
})