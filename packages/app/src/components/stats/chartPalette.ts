// Copied from packages/ui/src/lib/chartPalette.ts. Series hues are chart data, validated for colour-vision separation
// against the dark surface. Hues are never cycled: series past the palette size are folded into one "Other" series.
const SERIES_COLORS = ['#c0f36e', '#6c9bf2', '#ff9e6b', '#d0bcff'] as const;

/** Neutral (outline) hue used for the aggregated overflow series. */
export const CHART_OVERFLOW_COLOR = '#8d937f';

export const CHART_MAX_SERIES = SERIES_COLORS.length;

export const seriesColorAt = (index: number): string => SERIES_COLORS[index] ?? CHART_OVERFLOW_COLOR;

export interface ChartSeries {
  readonly name: string;
  /** One value per bucket, aligned with the chart labels. */
  readonly values: readonly number[];
}
