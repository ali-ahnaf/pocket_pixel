import { memo } from 'react';
import { ms } from 'react-native-size-matters';
import Svg, { Path } from 'react-native-svg';
import { PIXEL_ICONS, PixelIconName, SPRITE_HIGHLIGHT, SPRITE_OUTLINE } from '../lib/pixelIcons';

export type { PixelIconName };

interface SpritePath {
  readonly key: string;
  readonly fill: string;
  readonly d: string;
}

const GRID = 16;
const DEFAULT_SIZE = ms(16);
const pathCache = new Map<PixelIconName, SpritePath[]>();

// One path per palette color, one 1px-tall rect per horizontal run of that color. Built once per icon.
const spritePaths = (name: PixelIconName): SpritePath[] => {
  const cached = pathCache.get(name);
  if (cached) return cached;
  const { palette, rows } = PIXEL_ICONS[name];
  const fills: Record<string, string> = { k: SPRITE_OUTLINE, w: SPRITE_HIGHLIGHT, ...palette };
  const runs = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === key) end++;
      if (key !== '.') runs.set(key, `${runs.get(key) ?? ''}M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  const paths = [...runs].map(([key, d]) => ({ key, fill: fills[key], d }));
  pathCache.set(name, paths);
  return paths;
};

export interface PixelIconProps {
  name: PixelIconName;
  /** Rendered width and height. Already scaled; pass ms(n) when overriding. */
  size?: number;
}

// Retro sprite icon. Decorative: the pressable or text around it carries the accessible label.
export const PixelIcon = memo(function PixelIcon({ name, size = DEFAULT_SIZE }: PixelIconProps) {
  return (
    <Svg width={Math.round(size)} height={Math.round(size)} viewBox={`0 0 ${GRID} ${GRID}`} accessible={false}>
      {spritePaths(name).map((p) => (
        <Path key={p.key} fill={p.fill} d={p.d} />
      ))}
    </Svg>
  );
});
