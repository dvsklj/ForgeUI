/**
 * Forge Design Tokens
 * 
 * CSS custom properties for theming. Components consume semantic tokens,
 * never raw values. Surface modes adjust token values.
 * 
 * Cascade layers: @layer tokens, base, components, surfaces
 */

import { css } from 'lit';

/** Design token CSS (injected into ForgeApp shadow root) */
export const tokenStyles = css`
  @layer tokens {
    :host {
      /* ─── Colors ─── */
      --forge-color-primary: #3b82f6;
      --forge-color-primary-hover: #2563eb;
      --forge-color-primary-active: #1d4ed8;
      --forge-color-primary-subtle: #eff6ff;
      
      --forge-color-success: #10b981;
      --forge-color-success-subtle: #ecfdf5;
      --forge-color-warning: #f59e0b;
      --forge-color-warning-subtle: #fffbeb;
      --forge-color-error: #ef4444;
      --forge-color-error-subtle: #fef2f2;
      --forge-color-info: #6366f1;
      --forge-color-info-subtle: #eef2ff;
      
      --forge-color-text: #1f2937;
      --forge-color-text-secondary: #6b7280;
      --forge-color-text-tertiary: #9ca3af;
      --forge-color-text-inverse: #ffffff;
      
      --forge-color-surface: #ffffff;
      --forge-color-surface-alt: #f9fafb;
      --forge-color-surface-hover: #f3f4f6;
      --forge-color-surface-active: #e5e7eb;
      
      --forge-color-border: #e5e7eb;
      --forge-color-border-strong: #d1d5db;
      
      /* ─── Spacing ─── */
      --forge-space-3xs: 0.125rem;  /* 2px */
      --forge-space-2xs: 0.25rem;   /* 4px */
      --forge-space-xs: 0.5rem;     /* 8px */
      --forge-space-sm: 0.75rem;    /* 12px */
      --forge-space-md: 1rem;       /* 16px */
      --forge-space-lg: 1.5rem;     /* 24px */
      --forge-space-xl: 2rem;       /* 32px */
      --forge-space-2xl: 3rem;      /* 48px */
      
      /* ─── Typography ─── */
      --forge-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --forge-font-mono: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
      
      --forge-text-xs: 0.75rem;     /* 12px */
      --forge-text-sm: 0.875rem;    /* 14px */
      --forge-text-base: 1rem;      /* 16px */
      --forge-text-lg: 1.125rem;    /* 18px */
      --forge-text-xl: 1.25rem;     /* 20px */
      --forge-text-2xl: 1.5rem;     /* 24px */
      --forge-text-3xl: 1.875rem;   /* 30px */
      
      --forge-weight-normal: 400;
      --forge-weight-medium: 500;
      --forge-weight-semibold: 600;
      --forge-weight-bold: 700;
      
      --forge-leading-tight: 1.25;
      --forge-leading-normal: 1.5;
      --forge-leading-relaxed: 1.75;
      
      /* ─── Radii ─── */
      --forge-radius-none: 0;
      --forge-radius-sm: 0.25rem;   /* 4px */
      --forge-radius-md: 0.5rem;    /* 8px */
      --forge-radius-lg: 0.75rem;   /* 12px */
      --forge-radius-xl: 1rem;      /* 16px */
      --forge-radius-full: 9999px;
      
      /* ─── Shadows ─── */
      --forge-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --forge-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --forge-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      
      /* ─── Transitions ─── */
      --forge-transition-fast: 150ms ease;
      --forge-transition-normal: 200ms ease;
      --forge-transition-slow: 300ms ease;
      
      /* ─── Sizes ─── */
      --forge-icon-sm: 1rem;        /* 16px */
      --forge-icon-md: 1.25rem;     /* 20px */
      --forge-icon-lg: 1.5rem;      /* 24px */
      
      --forge-input-height: 2.5rem; /* 40px */
      --forge-button-height: 2.5rem;
      --forge-touch-target: 2.75rem; /* 44px — Apple HIG minimum */
    }

    /* ─── Dark mode ─── */
    :host([color-scheme="dark"]),
    :host(:where([color-scheme="dark"])) {
      --forge-color-primary: #60a5fa;
      --forge-color-primary-hover: #93bbfd;
      --forge-color-primary-active: #3b82f6;
      --forge-color-primary-subtle: #1e3a5f;
      
      --forge-color-success: #34d399;
      --forge-color-success-subtle: #064e3b;
      --forge-color-warning: #fbbf24;
      --forge-color-warning-subtle: #78350f;
      --forge-color-error: #f87171;
      --forge-color-error-subtle: #7f1d1d;
      --forge-color-info: #818cf8;
      --forge-color-info-subtle: #312e81;
      
      --forge-color-text: #f9fafb;
      --forge-color-text-secondary: #d1d5db;
      --forge-color-text-tertiary: #9ca3af;
      --forge-color-text-inverse: #111827;
      
      --forge-color-surface: #1f2937;
      --forge-color-surface-alt: #374151;
      --forge-color-surface-hover: #4b5563;
      --forge-color-surface-active: #6b7280;
      
      --forge-color-border: #374151;
      --forge-color-border-strong: #4b5563;
    }

    /* Auto-detect system preference when no explicit scheme set */
    @media (prefers-color-scheme: dark) {
      :host(:not([color-scheme])) {
        --forge-color-primary: #60a5fa;
        --forge-color-primary-hover: #93bbfd;
        --forge-color-primary-active: #3b82f6;
        --forge-color-primary-subtle: #1e3a5f;
        
        --forge-color-success: #34d399;
        --forge-color-success-subtle: #064e3b;
        --forge-color-warning: #fbbf24;
        --forge-color-warning-subtle: #78350f;
        --forge-color-error: #f87171;
        --forge-color-error-subtle: #7f1d1d;
        --forge-color-info: #818cf8;
        --forge-color-info-subtle: #312e81;
        
        --forge-color-text: #f9fafb;
        --forge-color-text-secondary: #d1d5db;
        --forge-color-text-tertiary: #9ca3af;
        --forge-color-text-inverse: #111827;
        
        --forge-color-surface: #1f2937;
        --forge-color-surface-alt: #374151;
        --forge-color-surface-hover: #4b5563;
        --forge-color-surface-active: #6b7280;
        
        --forge-color-border: #374151;
        --forge-color-border-strong: #4b5563;
      }
    }
  }

  @layer base {
    :host {
      display: block;
      font-family: var(--forge-font-family);
      font-size: var(--forge-text-base);
      line-height: var(--forge-leading-normal);
      color: var(--forge-color-text);
      background: var(--forge-color-surface);
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
      --forge-space-md: 0.75rem;
      --forge-space-lg: 1rem;
      --forge-space-xl: 1.5rem;
      --forge-text-base: 0.875rem;
      --forge-input-height: 2.25rem;
      --forge-button-height: 2.25rem;
    }

    /* Standalone: full-width, touch-friendly */
    :host([surface="standalone"]) {
      min-height: 100dvh;
    }

    /* Embed: minimal chrome */
    :host([surface="embed"]) {
      --forge-shadow-md: none;
      --forge-radius-md: 0;
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
