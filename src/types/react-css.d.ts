import 'react';

// Lets inline styles set CSS custom properties without casting to React.CSSProperties.
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
