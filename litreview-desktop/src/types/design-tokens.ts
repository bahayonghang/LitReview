/**
 * Design Tokens Type Definitions
 * Provides type safety for design system usage
 */

// ===========================================================================
// COLOR TYPES
// ===========================================================================

export type ColorToken =
  | `color-${ColorCategory}-${ColorShade}`
  | `color-${SemanticColor}-${ColorShade}`
  | `color-text-${TextType}`
  | `color-bg-${BgType}`;

export type ColorCategory = 'primary' | 'secondary' | 'gray';
export type SemanticColor = 'success' | 'warning' | 'error' | 'info';
export type ColorShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type TextType = 'primary' | 'secondary' | 'muted' | 'inverse';
export type BgType = 'primary' | 'secondary' | 'tertiary';

// ===========================================================================
// TYPOGRAPHY TYPES
// ===========================================================================

export type FontFamilyToken = 'font-family-primary' | 'font-family-mono' | 'font-family-display';
export type FontSizeToken =
  | 'font-size-xs'
  | 'font-size-sm'
  | 'font-size-base'
  | 'font-size-lg'
  | 'font-size-xl'
  | 'font-size-2xl'
  | 'font-size-3xl'
  | 'font-size-4xl';

export type FontWeightToken =
  | 'font-weight-thin'
  | 'font-weight-extralight'
  | 'font-weight-light'
  | 'font-weight-normal'
  | 'font-weight-medium'
  | 'font-weight-semibold'
  | 'font-weight-bold'
  | 'font-weight-extrabold'
  | 'font-weight-black';

export type LineHeightToken =
  | 'line-height-tight'
  | 'line-height-snug'
  | 'line-height-normal'
  | 'line-height-relaxed'
  | 'line-height-loose';

export type TypographyToken = FontSizeToken | FontWeightToken | LineHeightToken | FontFamilyToken;

// ===========================================================================
// SPACING TYPES
// ===========================================================================

export type SpacingToken =
  | `space-${SpacingScale}`
  | `space-${SpacingScale}-${SpacingScale}`;

export type SpacingScale =
  | '0'
  | '0-5'
  | '1'
  | '1-5'
  | '2'
  | '2-5'
  | '3'
  | '3-5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32';

// ===========================================================================
// BORDER RADIUS TYPES
// ===========================================================================

export type BorderRadiusToken =
  | 'radius-none'
  | 'radius-sm'
  | 'radius-base'
  | 'radius-md'
  | 'radius-lg'
  | 'radius-xl'
  | 'radius-2xl'
  | 'radius-3xl'
  | 'radius-full';

// ===========================================================================
// SHADOW TYPES
// ===========================================================================

export type ShadowToken =
  | 'shadow-sm'
  | 'shadow-base'
  | 'shadow-md'
  | 'shadow-lg'
  | 'shadow-xl'
  | 'shadow-2xl'
  | 'shadow-glass-sm'
  | 'shadow-glass-md'
  | 'shadow-glass-lg';

// ===========================================================================
// BACKDROP TYPES
// ===========================================================================

export type BlurToken =
  | 'blur-sm'
  | 'blur-base'
  | 'blur-md'
  | 'blur-lg'
  | 'blur-xl'
  | 'blur-2xl';

export type BackdropToken =
  | 'backdrop-blur-sm'
  | 'backdrop-blur-base'
  | 'backdrop-blur-md'
  | 'backdrop-blur-lg';

// ===========================================================================
// Z-INDEX TYPES
// ===========================================================================

export type ZIndexToken =
  | 'z-dropdown'
  | 'z-sticky'
  | 'z-fixed'
  | 'z-modal-backdrop'
  | 'z-modal'
  | 'z-popover'
  | 'z-tooltip'
  | 'z-toast';

// ===========================================================================
// ANIMATION TYPES
// ===========================================================================

export type DurationToken =
  | 'duration-75'
  | 'duration-100'
  | 'duration-150'
  | 'duration-200'
  | 'duration-300'
  | 'duration-500'
  | 'duration-700'
  | 'duration-1000';

export type EasingToken =
  | 'ease-linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-bounce';

export type TransitionToken =
  | 'transition-colors'
  | 'transition-opacity'
  | 'transition-shadow'
  | 'transition-transform'
  | 'transition-all';

// ===========================================================================
// COMPLEX TYPES
// ===========================================================================

export type DesignToken =
  | ColorToken
  | TypographyToken
  | SpacingToken
  | BorderRadiusToken
  | ShadowToken
  | BlurToken
  | BackdropToken
  | ZIndexToken
  | DurationToken
  | EasingToken
  | TransitionToken;

// ===========================================================================
// THEME TYPES
// ===========================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  highContrast?: boolean;
  reducedMotion?: boolean;
}

// ===========================================================================
// RESPONSIVE BREAKPOINTS
// ===========================================================================

export type BreakpointToken = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointValue {
  sm: string;   // 640px
  md: string;   // 768px
  lg: string;   // 1024px
  xl: string;   // 1280px
  '2xl': string; // 1536px
}

// ===========================================================================
// COMPONENT PROP TYPES
// ===========================================================================

export interface ColorProps {
  color?: ColorToken;
  backgroundColor?: ColorToken;
  borderColor?: ColorToken;
}

export interface TypographyProps {
  fontFamily?: FontFamilyToken;
  fontSize?: FontSizeToken;
  fontWeight?: FontWeightToken;
  lineHeight?: LineHeightToken;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface SpacingProps {
  margin?: SpacingToken;
  marginTop?: SpacingToken;
  marginRight?: SpacingToken;
  marginBottom?: SpacingToken;
  marginLeft?: SpacingToken;
  padding?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingRight?: SpacingToken;
  paddingBottom?: SpacingToken;
  paddingLeft?: SpacingToken;
}

export interface LayoutProps {
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  zIndex?: ZIndexToken | number;
}

export interface BorderProps {
  borderRadius?: BorderRadiusToken;
  borderWidth?: string | number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  boxShadow?: ShadowToken;
}

export interface AnimationProps {
  transition?: TransitionToken;
  duration?: DurationToken;
  easing?: EasingToken;
  transform?: string;
  opacity?: number;
}

// ===========================================================================
// UTILITY TYPES
// ===========================================================================

export type CSSProperties = {
  [K in DesignToken]?: string;
};

export type Responsive<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

export type StyleProps =
  & ColorProps
  & TypographyProps
  & SpacingProps
  & LayoutProps
  & BorderProps
  & AnimationProps;

// ===========================================================================
// TYPE GUARDS
// ===========================================================================

export function isColorToken(token: string): token is ColorToken {
  return /^color-(primary|secondary|gray|success|warning|error|info|text|bg)-\w+/.test(token);
}

export function isSpacingToken(token: string): token is SpacingToken {
  return /^space-\d+(\.\d+)*$/.test(token);
}

export function isFontSizeToken(token: string): token is FontSizeToken {
  return /^font-size-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(token);
}

export function isThemeMode(mode: string): mode is ThemeMode {
  return mode === 'light' || mode === 'dark' || mode === 'system';
}

// ===========================================================================
// TOKEN MAPS FOR RUNTIME LOOKUP
// ===========================================================================

export const COLOR_CATEGORIES = ['primary', 'secondary', 'gray'] as const;
export const SEMANTIC_COLORS = ['success', 'warning', 'error', 'info'] as const;
export const COLOR_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;
export const FONT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
export const FONT_WEIGHTS = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'] as const;
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

export const BREAKPOINT_VALUES: BreakpointValue = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

/**
 * Get CSS custom property value for a design token
 */
export function getTokenValue(token: DesignToken): string {
  return `var(--${token})`;
}

/**
 * Create responsive styles using design tokens
 */
export function responsive<T extends Record<string, any>>(
  property: string,
  values: Responsive<T>,
  tokenExtractor: (value: T) => string
): Record<string, string> {
  const styles: Record<string, string> = {};

  if (typeof values === 'object' && values !== null) {
    Object.entries(values).forEach(([breakpoint, value]) => {
      if (breakpoint === 'base') {
        styles[property] = tokenExtractor(value);
      } else {
        const mediaQuery = BREAKPOINTS.includes(breakpoint as BreakpointToken)
          ? `(min-width: ${BREAKPOINT_VALUES[breakpoint as BreakpointToken]})`
          : breakpoint;

        styles[`@media ${mediaQuery}`] = `${property}: ${tokenExtractor(value)};`;
      }
    });
  } else {
    styles[property] = tokenExtractor(values as T);
  }

  return styles;
}