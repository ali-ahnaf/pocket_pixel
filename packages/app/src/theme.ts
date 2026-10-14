// Tokens ported from packages/ui/tailwind.config.ts. The web app is dark only, so the native app is too.
export const color = {
  bg: '#141315',
  surfaceLowest: '#0e0e10',
  surfaceLow: '#1c1b1e',
  surface: '#201f22',
  surfaceHigh: '#2a292c',
  surfaceHighest: '#353437',
  onSurface: '#e5e1e5',
  onSurfaceVariant: '#c3c9b3',
  outline: '#8d937f',
  outlineVariant: '#434938',
  border: '#000000',
  primary: '#a5d655',
  onPrimary: '#223600',
  primaryContainer: '#7caa2d',
  onPrimaryContainer: '#253a00',
  secondary: '#edbd9a',
  secondaryContainer: '#613f25',
  onSecondaryContainer: '#daac8a',
  tertiary: '#acc7ff',
  tertiaryContainer: '#6c9bf2',
  onTertiaryContainer: '#00326d',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const font = {
  heading: 'Anybody_800ExtraBold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_700Bold',
};

// Pass through ms() at the call site, e.g. padding: ms(space[4]).
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 };

// Horizontal padding for page content and the app bar. Pass through ms().
export const gutter = space[4];

// Pass through ms() at the call site.
export const text = {
  headlineLg: { fontSize: 20, lineHeight: 31 },
  headlineMd: { fontSize: 18, lineHeight: 24 },
  bodyLg: { fontSize: 16, lineHeight: 26 },
  bodySm: { fontSize: 14, lineHeight: 21 },
  labelCaps: { fontSize: 12, lineHeight: 12 },
};

// Box shadows ported from packages/ui/src/app/globals.css. boxShadow (including inset) needs the New Architecture, the only one RN 0.82+ ships.
export const shadow = {
  card: 'inset 2px 2px 0 rgba(255, 255, 255, 0.08), inset -2px -2px 0 rgba(0, 0, 0, 0.5)',
  cardElevated: 'inset 2px 2px 0 rgba(255, 255, 255, 0.1), inset -2px -2px 0 rgba(0, 0, 0, 0.5), 4px 4px 0 #000000',
  window: 'inset 2px 2px 0 rgba(255, 255, 255, 0.08), inset -2px -2px 0 rgba(0, 0, 0, 0.5), 6px 6px 0 #000000',
  input: 'inset 0 2px 0 rgba(0, 0, 0, 0.9), inset 2px 0 0 rgba(0, 0, 0, 0.4)',
  popover: '8px 8px 0 #000000',
  coin: '4px 4px 0 #000000',
  toggleActive: 'inset 2px 2px 0 rgba(255, 255, 255, 0.1), inset -2px -2px 0 rgba(0, 0, 0, 0.4)',
  button: {
    primary: 'inset 2px 2px 0 rgba(255, 255, 255, 0.3), inset -2px -2px 0 rgba(0, 0, 0, 0.4), 0 4px 0 #344e00',
    secondary: 'inset 2px 2px 0 rgba(255, 255, 255, 0.15), inset -2px -2px 0 rgba(0, 0, 0, 0.4), 0 4px 0 #2a1500',
    tertiary: 'inset 2px 2px 0 rgba(255, 255, 255, 0.2), inset -2px -2px 0 rgba(0, 0, 0, 0.4), 0 4px 0 #003a82',
    ghost: 'inset 2px 2px 0 rgba(255, 255, 255, 0.08), inset -2px -2px 0 rgba(0, 0, 0, 0.3)',
    danger: 'inset 2px 2px 0 rgba(255, 255, 255, 0.2), inset -2px -2px 0 rgba(0, 0, 0, 0.4), 0 4px 0 #400003',
    pressed: 'inset -2px -2px 0 rgba(255, 255, 255, 0.05), inset 2px 2px 0 rgba(0, 0, 0, 0.4)',
  },
};
