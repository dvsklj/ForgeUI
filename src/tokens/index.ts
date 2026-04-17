/**
 * Forge Design Tokens
 * 
 * CSS custom properties for theming. Components consume semantic tokens,
 * never raw values. Surface modes adjust token values.
 * 
 * Cascade layers: @layer tokens, base, components, surfaces
 */

import { css } from 'lit';

/** Design token CSS (injected into ForgeUIApp shadow root) */
export const tokenStyles = css`
  @layer tokens {
    :host {
      /* ─── Colors ─── */
      --forgeui-color-primary: #3b82f6;
      --forgeui-color-primary-hover: #2563eb;
      --forgeui-color-primary-active: #1d4ed8;
      --forgeui-color-primary-subtle: #eff6ff;
      
      --forgeui-color-success: #10b981;
      --forgeui-color-success-subtle: #ecfdf5;
      --forgeui-color-warning: #f59e0b;
      --forgeui-color-warning-subtle: #fffbeb;
      --forgeui-color-error: #ef4444;
      --forgeui-color-error-subtle: #fef2f2;
      --forgeui-color-info: #6366f1;
      --forgeui-color-info-subtle: #eef2ff;
      
      --forgeui-color-text: #1f2937;
      --forgeui-color-text-secondary: #6b7280;
      --forgeui-color-text-tertiary: #9ca3af;
      --forgeui-color-text-inverse: #ffffff;
      
      --forgeui-color-surface: #ffffff;
      --forgeui-color-surface-alt: #f9fafb;
      --forgeui-color-surface-hover: #f3f4f6;
      --forgeui-color-surface-active: #e5e7eb;
      
      --forgeui-color-border: #e5e7eb;
      --forgeui-color-border-strong: #d1d5db;
      
      /* ─── Spacing ─── */
      --forgeui-space-3xs: 0.125rem;  /* 2px */
      --forgeui-space-2xs: 0.25rem;   /* 4px */
      --forgeui-space-xs: 0.5rem;     /* 8px */
      --forgeui-space-sm: 0.75rem;    /* 12px */
      --forgeui-space-md: 1rem;       /* 16px */
      --forgeui-space-lg: 1.5rem;     /* 24px */
      --forgeui-space-xl: 2rem;       /* 32px */
      --forgeui-space-2xl: 3rem;      /* 48px */
      
      /* ─── Typography ─── */
      --forgeui-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --forgeui-font-mono: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
      
      --forgeui-text-xs: 0.75rem;     /* 12px */
      --forgeui-text-sm: 0.875rem;    /* 14px */
      --forgeui-text-base: 1rem;      /* 16px */
      --forgeui-text-lg: 1.125rem;    /* 18px */
      --forgeui-text-xl: 1.25rem;     /* 20px */
      --forgeui-text-2xl: 1.5rem;     /* 24px */
      --forgeui-text-3xl: 1.875rem;   /* 30px */
      
      --forgeui-weight-normal: 400;
      --forgeui-weight-medium: 500;
      --forgeui-weight-semibold: 600;
      --forgeui-weight-bold: 700;
      
      --forgeui-leading-tight: 1.25;
      --forgeui-leading-normal: 1.5;
      --forgeui-leading-relaxed: 1.75;
      
      /* ─── Radii ─── */
      --forgeui-radius-none: 0;
      --forgeui-radius-sm: 0.25rem;   /* 4px */
      --forgeui-radius-md: 0.5rem;    /* 8px */
      --forgeui-radius-lg: 0.75rem;   /* 12px */
      --forgeui-radius-xl: 1rem;      /* 16px */
      --forgeui-radius-full: 9999px;
      
      /* ─── Shadows ─── */
      --forgeui-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --forgeui-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --forgeui-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      
      /* ─── Transitions ─── */
      --forgeui-transition-fast: 150ms ease;
      --forgeui-transition-normal: 200ms ease;
      --forgeui-transition-slow: 300ms ease;
      
      /* ─── Sizes ─── */
      --forgeui-icon-sm: 1rem;        /* 16px */
      --forgeui-icon-md: 1.25rem;     /* 20px */
      --forgeui-icon-lg: 1.5rem;      /* 24px */
      
      --forgeui-input-height: 2.5rem; /* 40px */
      --forgeui-button-height: 2.5rem;
      --forgeui-touch-target: 2.75rem; /* 44px — Apple HIG minimum */

      /* ─── Chart palette (6–10) ─── */
      --forgeui-color-chart-6: #8b5cf6;
      --forgeui-color-chart-7: #ec4899;
      --forgeui-color-chart-8: #14b8a6;
      --forgeui-color-chart-9: #f97316;
      --forgeui-color-chart-10: #6b7280;
    }

    /* ─── Dark mode ─── */
    :host([color-scheme="dark"]),
    :host(:where([color-scheme="dark"])) {
      --forgeui-color-primary: #60a5fa;
      --forgeui-color-primary-hover: #93bbfd;
      --forgeui-color-primary-active: #3b82f6;
      --forgeui-color-primary-subtle: #1e3a5f;
      
      --forgeui-color-success: #34d399;
      --forgeui-color-success-subtle: #064e3b;
      --forgeui-color-warning: #fbbf24;
      --forgeui-color-warning-subtle: #78350f;
      --forgeui-color-error: #f87171;
      --forgeui-color-error-subtle: #7f1d1d;
      --forgeui-color-info: #818cf8;
      --forgeui-color-info-subtle: #312e81;
      
      --forgeui-color-text: #f9fafb;
      --forgeui-color-text-secondary: #d1d5db;
      --forgeui-color-text-tertiary: #9ca3af;
      --forgeui-color-text-inverse: #111827;
      
      --forgeui-color-surface: #1f2937;
      --forgeui-color-surface-alt: #374151;
      --forgeui-color-surface-hover: #4b5563;
      --forgeui-color-surface-active: #6b7280;
      
      --forgeui-color-border: #374151;
      --forgeui-color-border-strong: #4b5563;

      /* ─── Chart palette (6–10, dark) ─── */
      --forgeui-color-chart-6: #a78bfa;
      --forgeui-color-chart-7: #f472b6;
      --forgeui-color-chart-8: #2dd4bf;
      --forgeui-color-chart-9: #fb923c;
      --forgeui-color-chart-10: #9ca3af;
    }

    /* Auto-detect system preference when no explicit scheme set */
    @media (prefers-color-scheme: dark) {
      :host(:not([color-scheme])) {
        --forgeui-color-primary: #60a5fa;
        --forgeui-color-primary-hover: #93bbfd;
        --forgeui-color-primary-active: #3b82f6;
        --forgeui-color-primary-subtle: #1e3a5f;
        
        --forgeui-color-success: #34d399;
        --forgeui-color-success-subtle: #064e3b;
        --forgeui-color-warning: #fbbf24;
        --forgeui-color-warning-subtle: #78350f;
        --forgeui-color-error: #f87171;
        --forgeui-color-error-subtle: #7f1d1d;
        --forgeui-color-info: #818cf8;
        --forgeui-color-info-subtle: #312e81;
        
        --forgeui-color-text: #f9fafb;
        --forgeui-color-text-secondary: #d1d5db;
        --forgeui-color-text-tertiary: #9ca3af;
        --forgeui-color-text-inverse: #111827;
        
        --forgeui-color-surface: #1f2937;
        --forgeui-color-surface-alt: #374151;
        --forgeui-color-surface-hover: #4b5563;
        --forgeui-color-surface-active: #6b7280;
        
        --forgeui-color-border: #374151;
        --forgeui-color-border-strong: #4b5563;

        /* ─── Chart palette (6–10, dark) ─── */
        --forgeui-color-chart-6: #a78bfa;
        --forgeui-color-chart-7: #f472b6;
        --forgeui-color-chart-8: #2dd4bf;
        --forgeui-color-chart-9: #fb923c;
        --forgeui-color-chart-10: #9ca3af;
      }
    }
  }

  @layer base {
    :host {
      display: block;
      font-family: var(--forgeui-font-family);
      font-size: var(--forgeui-text-base);
      line-height: var(--forgeui-leading-normal);
      color: var(--forgeui-color-text);
      background: var(--forgeui-color-surface);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }
  }
`;

/** Surface-specific overrides */
export const surfaceStyles = css`
  @layer surfaces {
    /* Chat: compact spacing, constrained width */
    :host([surface="chat"]) {
      --forgeui-space-md: 0.75rem;
      --forgeui-space-lg: 1rem;
      --forgeui-space-xl: 1.5rem;
      --forgeui-text-base: 0.875rem;
      --forgeui-input-height: 2.25rem;
      --forgeui-button-height: 2.25rem;
    }

    /* Standalone: full-width, touch-friendly */
    :host([surface="standalone"]) {
      min-height: 100dvh;
    }

    /* Embed: minimal chrome */
    :host([surface="embed"]) {
      --forgeui-shadow-md: none;
      --forgeui-radius-md: 0;
    }
  }
`;

/** Shared reset styles for component shadow roots */
export const resetStyles = css`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;
