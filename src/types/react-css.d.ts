import 'react';

// Allow the CSS custom properties this app sets via inline `style` without
// casting through `as React.CSSProperties` at every call site.
declare module 'react' {
  interface CSSProperties {
    '--tab-color'?: string;
    '--pill-color'?: string;
    '--sector-color'?: string;
    '--dot-color'?: string;
    '--tooltip-x'?: string;
    '--tooltip-y'?: string;
    '--tooltip-flip'?: string;
  }
}
