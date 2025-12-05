# Component Library

This section covers the UI components and design system used in LitReview Pro.

## Design System Overview

LitReview Pro uses a comprehensive design system built on modern CSS with glassmorphism aesthetics and accessibility in mind.

### Core Principles

1. **Consistency**: Unified design language across all components
2. **Accessibility**: WCAG AA/AAA compliance with keyboard navigation
3. **Responsive**: Mobile-first design approach
4. **Performance**: Optimized for speed and efficiency
5. **Maintainability**: Easy to customize and extend

### Design Tokens

The design system is based on CSS custom properties (design tokens) that ensure consistency:

```css
:root {
  /* Colors */
  --color-primary-500: #6366f1;
  --color-secondary-500: #f093fb;
  --color-success-500: #10b981;

  /* Typography */
  --font-family-primary: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;

  /* Spacing */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* Animation */
  --duration-200: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

## Color System

### Primary Palette

- **Primary-50**: `#eff6ff` - Light background
- **Primary-500**: `#6366f1` - Main brand color
- **Primary-900**: `#312e81` - Dark background

### Semantic Colors

- **Success**: `#10b981` - Positive actions, success states
- **Warning**: `#f59e0b` - Warnings, caution
- **Error**: `#ef4444` - Errors, destructive actions
- **Info**: `#3b82f6` - Information, help

### Theme Support

The design system supports light, dark, and high-contrast themes:

```css
[data-theme="dark"] {
  --color-text-primary: #f9fafb;
  --color-bg-primary: #111827;
}

[data-theme="high-contrast"] {
  --color-border-width: 2px;
  --contrast-ratio: 7;
}
```

## Typography System

### Font Family

- **Primary**: Inter (UI text)
- **Display**: Inter Display (headings)
- **Mono**: JetBrains Mono (code, data)

### Type Scale

| Scale | Size | Line Height | Usage |
|-------|------|-------------|--------|
| xs | 0.75rem | 1rem | Labels, captions |
| sm | 0.875rem | 1.25rem | Small text |
| base | 1rem | 1.5rem | Body text |
| lg | 1.125rem | 1.75rem | Large text |
| xl | 1.25rem | 1.75rem | Subheadings |
| 2xl | 1.5rem | 2rem | Headings |
| 3xl | 1.875rem | 2.25rem | Large headings |
| 4xl | 2.25rem | 2.5rem | Hero headings |

## Spacing System

Based on a 4px grid system for consistency:

- **1**: 4px - Micro spacing
- **2**: 8px - Tiny spacing
- **3**: 12px - Small spacing
- **4**: 16px - Default spacing
- **6**: 24px - Medium spacing
- **8**: 32px - Large spacing
- **12**: 48px - Extra large spacing
- **16**: 64px - Huge spacing

## Core Components

### Glass Container

The foundation of the glassmorphism design:

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--backdrop-blur-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}
```

### Buttons

#### Primary Button
```jsx
<button className="btn btn-primary">
  Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="btn btn-secondary">
  Secondary Action
</button>
```

#### Ghost Button
```jsx
<button className="btn btn-ghost">
  Ghost Action
</button>
```

### Form Controls

#### Input Field
```jsx
<input
  type="text"
  className="input input-primary"
  placeholder="Enter text..."
/>
```

#### Select Dropdown
```jsx
<select className="select select-primary">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

#### Textarea
```jsx
<textarea
  className="textarea textarea-primary"
  placeholder="Enter multiple lines..."
/>
```

### Cards

#### Basic Card
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    <p>Card content goes here</p>
  </div>
</div>
```

#### Interactive Card
```jsx
<div className="card card-interactive">
  <div className="card-header">
    <h3 className="card-title">Interactive Card</h3>
  </div>
  <div className="card-body">
    <p>This card has hover effects</p>
  </div>
</div>
```

## Layout Components

### Container
```jsx
<div className="container">
  <div className="container-content">
    Content
  </div>
</div>
```

### Grid System
```jsx
<div className="grid grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Flexbox Utilities
```jsx
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Navigation Components

### Sidebar
```jsx
<Sidebar
  items={navigationItems}
  activeItem="dashboard"
  onItemChange={handleNavigation}
/>
```

### Breadcrumb
```jsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Components' }
  ]}
/>
```

## Feedback Components

### Loading States
```jsx
<Spinner size="sm" />
<ProgressBar value={75} />
```

### Notifications
```jsx
<Alert type="success" message="Operation completed!" />
<Toast message="Settings saved" />
```

### Modals
```jsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalHeader>Modal Title</ModalHeader>
  <ModalBody>Modal content</ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Close</Button>
  </ModalFooter>
</Modal>
```

## Data Display

### Tables
```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Charts
```jsx
<MiniChart data={data} color="#6366f1" />
<StatsCard
  title="Total Users"
  value="1,234"
  trend={{ value: 12, isPositive: true }}
/>
```

## Usage Guidelines

### Component Composition

```jsx
// ✅ Good: Use semantic HTML structure
<article className="card">
  <header className="card-header">
    <h2 className="card-title">Title</h2>
  </header>
  <main className="card-body">
    <p>Content</p>
  </main>
  <footer className="card-footer">
    <button>Action</button>
  </footer>
</article>

// ❌ Avoid: Non-semantic divs
<div className="card">
  <div className="card-title">Title</div>
  <div className="card-content">Content</div>
</div>
```

### Accessibility

```jsx
// ✅ Good: Include accessibility attributes
<button
  type="button"
  aria-label="Close dialog"
  onClick={handleClose}
>
  ×
</button>

// ✅ Good: Keyboard navigation support
<input
  type="text"
  aria-describedby="help-text"
  onKeyDown={handleKeyDown}
/>
<div id="help-text" className="help-text">
  Enter your email address
</div>
```

### Responsive Design

```jsx
// ✅ Good: Mobile-first responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Customization

### Extending the Design System

1. **Add new tokens** in `design-tokens.css`
2. **Create component variants** using CSS custom properties
3. **Build compound components** from base components
4. **Follow naming conventions** for consistency

### Theming

```css
/* Custom theme example */
[data-theme="custom"] {
  --color-primary-500: #your-color;
  --font-family-primary: 'Your Font', sans-serif;
  --border-radius-lg: 12px;
}
```

## Best Practices

1. **Use semantic HTML** for accessibility
2. **Follow mobile-first design** principles
3. **Test with keyboard navigation**
4. **Validate color contrast ratios**
5. **Use consistent spacing** from the token system
6. **Optimize images and assets**
7. **Test across browsers and devices**

---

For component-specific documentation, see [UI Components](/components/ui-components) and [Custom Hooks](/components/hooks).