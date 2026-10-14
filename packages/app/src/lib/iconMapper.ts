import { PIXEL_ICONS, PixelIconName } from './pixelIcons';

// Native stand-in for packages/ui/src/lib/iconMapper.ts. Vaults and tags store lucide icon names; each one has a
// pixel sprite of the same name. Unknown or legacy names fall back to a question mark.
export const toPixelIcon = (name?: string | null): PixelIconName => (name && name in PIXEL_ICONS ? (name as PixelIconName) : 'CircleHelp');
