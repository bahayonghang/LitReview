/**
 * VitePress Theme Configuration
 * Custom theme for LitReview Pro documentation
 */

import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import { h } from 'vue'

// Import custom components
import './custom.css'

// Custom components
const CustomLayout = () => {
  return h(DefaultTheme.Layout, null, {
    // Add custom slots here if needed
  })
}

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,

  enhanceApp({ app, router, siteData }) {
    // Add global components
    // app.component('CustomComponent', CustomComponent)

    // Add custom directives
    // app.directive('highlight', highlightDirective)
  }
} satisfies Theme