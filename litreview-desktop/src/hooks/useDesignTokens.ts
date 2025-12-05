/**
 * Design Tokens React Hook
 * Provides easy access to design token values with responsive support
 */

import { useMemo } from 'react';
import type {
  DesignToken,
  ColorToken,
  TypographyToken,
  SpacingToken,
  BorderRadiusToken,
  ShadowToken,
  ThemeMode,
  Responsive,
  BreakpointToken
} from '../types/design-tokens';

/**
 * Get design token value
 */
export function getTokenValue(token: DesignToken): string {
  return `var(--${token})`;
}

/**
 * Hook for accessing design tokens
 */
export function useDesignToken<T extends DesignToken>(
  token: T,
  responsive?: Responsive<T>
): string | Record<string, string> {
  return useMemo(() => {
    if (!responsive || typeof responsive === 'string' || typeof responsive === 'number') {
      return getTokenValue(token);
    }

    const styles: Record<string, string> = {};

    Object.entries(responsive).forEach(([breakpoint, value]) => {
      if (breakpoint === 'base') {
        styles[breakpoint] = getTokenValue(value as T);
      } else {
        const mediaQuery = `(min-width: ${getBreakpointValue(breakpoint as BreakpointToken)})`;
        styles[`@media ${mediaQuery}`] = getTokenValue(value as T);
      }
    });

    return styles;
  }, [token, responsive]);
}

/**
 * Hook for color tokens with theme awareness
 */
export function useColorToken(color: ColorToken): string {
  return useMemo(() => getTokenValue(color), [color]);
}

/**
 * Hook for typography tokens
 */
export function useTypographyToken(token: TypographyToken): string {
  return useMemo(() => getTokenValue(token), [token]);
}

/**
 * Hook for spacing tokens
 */
export function useSpacingToken(spacing: SpacingToken): string {
  return useMemo(() => getTokenValue(spacing), [spacing]);
}

/**
 * Hook for border radius tokens
 */
export function useBorderRadiusToken(radius: BorderRadiusToken): string {
  return useMemo(() => getTokenValue(radius), [radius]);
}

/**
 * Hook for shadow tokens
 */
export function useShadowToken(shadow: ShadowToken): string {
  return useMemo(() => getTokenValue(shadow), [shadow]);
}

/**
 * Hook for theme management
 */
export function useTheme(): {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  systemTheme: ThemeMode;
} {
  return useMemo(() => {
    const getTheme = (): ThemeMode => {
      if (typeof window === 'undefined') return 'dark';
      const saved = localStorage.getItem('litreview-theme') as ThemeMode;
      if (saved && ['light', 'dark', 'system'].includes(saved)) return saved;
      return 'system';
    };

    const getSystemTheme = (): ThemeMode => {
      if (typeof window === 'undefined') return 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const getEffectiveTheme = (): ThemeMode => {
      const theme = getTheme();
      return theme === 'system' ? getSystemTheme() : theme;
    };

    const setTheme = (theme: ThemeMode) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('litreview-theme', theme);

      const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    const toggleTheme = () => {
      const current = getEffectiveTheme();
      setTheme(current === 'dark' ? 'light' : 'dark');
    };

    return {
      theme: getTheme(),
      systemTheme: getSystemTheme(),
      setTheme,
      toggleTheme,
    };
  }, []);
}

/**
 * Hook for responsive design tokens
 */
export function useResponsiveToken<T extends DesignToken>(
  token: T,
  values: Responsive<T>
): Record<string, string> {
  return useMemo(() => {
    const styles: Record<string, string> = {};

    Object.entries(values).forEach(([breakpoint, value]) => {
      if (breakpoint === 'base') {
        styles[''] = getTokenValue(value as T);
      } else {
        const mediaQuery = `(min-width: ${getBreakpointValue(breakpoint as BreakpointToken)})`;
        styles[`@media ${mediaQuery}`] = getTokenValue(value as T);
      }
    });

    return styles;
  }, [token, values]);
}

/**
 * Hook for creating CSS-in-JS styles with design tokens
 */
export function useDesignTokens() {
  const color = useColorToken;
  const typography = useTypographyToken;
  const spacing = useSpacingToken;
  const borderRadius = useBorderRadiusToken;
  const shadow = useShadowToken;
  const responsive = useResponsiveToken;
  const theme = useTheme();

  return {
    getTokenValue,
    color,
    typography,
    spacing,
    borderRadius,
    shadow,
    responsive,
    theme,
  };
}

/**
 * Helper function to get breakpoint value
 */
function getBreakpointValue(breakpoint: BreakpointToken): string {
  const values: Record<BreakpointToken, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };
  return values[breakpoint];
}

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: BreakpointToken | null;
} {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        currentBreakpoint: null,
      };
    }

    const width = window.innerWidth;

    const getBreakpoint = (): BreakpointToken | null => {
      if (width >= 1536) return '2xl';
      if (width >= 1280) return 'xl';
      if (width >= 1024) return 'lg';
      if (width >= 768) return 'md';
      if (width >= 640) return 'sm';
      return null;
    };

    const currentBreakpoint = getBreakpoint();

    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024 && width < 1536,
      isLargeDesktop: width >= 1536,
      currentBreakpoint,
    };
  }, []);
}

/**
 * Hook for accessibility preferences
 */
export function useAccessibilityPreferences() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        prefersReducedMotion: false,
        prefersHighContrast: false,
        prefersDark: false,
      };
    }

    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    };
  }, []);
}

/**
 * Hook for creating responsive style objects
 */
export function useResponsiveStyle(
  styleProperty: string,
  values: Responsive<string | number>
): React.CSSProperties {
  const { currentBreakpoint } = useBreakpoint();

  return useMemo(() => {
    const breakpoints: BreakpointToken[] = ['sm', 'md', 'lg', 'xl', '2xl'];

    // Find the matching breakpoint
    let matchedValue: string | number | undefined;

    if (typeof values === 'string' || typeof values === 'number') {
      matchedValue = values;
    } else {
      // Check for exact breakpoint match first
      if (currentBreakpoint && values[currentBreakpoint] !== undefined) {
        matchedValue = values[currentBreakpoint];
      } else {
        // Find the largest breakpoint that has a value and is <= current
        const currentValueIndex = currentBreakpoint ? breakpoints.indexOf(currentBreakpoint) : -1;

        for (let i = currentValueIndex; i >= 0; i--) {
          const bp = breakpoints[i];
          if (values[bp] !== undefined) {
            matchedValue = values[bp];
            break;
          }
        }

        // Fall back to base value
        if (matchedValue === undefined && values.base !== undefined) {
          matchedValue = values.base;
        }
      }
    }

    return matchedValue ? { [styleProperty]: matchedValue } : {};
  }, [styleProperty, values, currentBreakpoint]);
}

/**
 * Default export combining all hooks
 */
export default useDesignTokens;