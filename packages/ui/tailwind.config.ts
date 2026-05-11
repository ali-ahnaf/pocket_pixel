import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0px",
      DEFAULT: "0px",
    },
    extend: {
      colors: {
        surface: "#141315",
        "surface-dim": "#141315",
        "surface-bright": "#3a393b",
        "surface-container-lowest": "#0e0e10",
        "surface-container-low": "#1c1b1e",
        "surface-container": "#201f22",
        "surface-container-high": "#2a292c",
        "surface-container-highest": "#353437",
        "on-surface": "#e5e1e5",
        "on-surface-variant": "#c3c9b3",
        "inverse-surface": "#e5e1e5",
        "inverse-on-surface": "#313033",
        outline: "#8d937f",
        "outline-variant": "#434938",
        "surface-tint": "#a5d655",
        primary: "#a5d655",
        "on-primary": "#223600",
        "primary-container": "#7caa2d",
        "on-primary-container": "#253a00",
        "inverse-primary": "#466800",
        "primary-fixed": "#c0f36e",
        "primary-fixed-dim": "#a5d655",
        "on-primary-fixed": "#121f00",
        "on-primary-fixed-variant": "#344e00",
        secondary: "#edbd9a",
        "on-secondary": "#472911",
        "secondary-container": "#613f25",
        "on-secondary-container": "#daac8a",
        "secondary-fixed": "#ffdcc4",
        "secondary-fixed-dim": "#edbd9a",
        "on-secondary-fixed": "#2e1501",
        "on-secondary-fixed-variant": "#613f25",
        tertiary: "#acc7ff",
        "on-tertiary": "#002f68",
        "tertiary-container": "#6c9bf2",
        "on-tertiary-container": "#00326d",
        "tertiary-fixed": "#d7e2ff",
        "tertiary-fixed-dim": "#acc7ff",
        "on-tertiary-fixed": "#001a40",
        "on-tertiary-fixed-variant": "#004492",
        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        background: "#141315",
        "on-background": "#e5e1e5",
        "surface-variant": "#353437",
      },
      fontFamily: {
        anybody: ["var(--font-anybody)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      spacing: {
        "block-1": "4px",
        "block-2": "8px",
        "block-3": "12px",
        "block-4": "16px",
        "block-5": "20px",
        "block-6": "24px",
        "block-8": "32px",
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-md": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1.0", fontWeight: "700" }],
      },
      boxShadow: {
        bevel: "inset 2px 2px 0 rgba(255,255,255,0.25), inset -2px -2px 0 rgba(0,0,0,0.5)",
        "bevel-pressed":
          "inset -2px -2px 0 rgba(255,255,255,0.1), inset 2px 2px 0 rgba(0,0,0,0.5)",
        "btn-primary":
          "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.4), 0 4px 0 #344e00",
        "btn-primary-pressed":
          "inset -2px -2px 0 rgba(255,255,255,0.1), inset 2px 2px 0 rgba(0,0,0,0.4)",
        "btn-secondary":
          "inset 2px 2px 0 rgba(255,255,255,0.15), inset -2px -2px 0 rgba(0,0,0,0.4), 0 4px 0 #2a1500",
        "btn-secondary-pressed":
          "inset -2px -2px 0 rgba(255,255,255,0.05), inset 2px 2px 0 rgba(0,0,0,0.4)",
        "btn-ghost":
          "inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3)",
        "btn-ghost-pressed":
          "inset -2px -2px 0 rgba(255,255,255,0.05), inset 2px 2px 0 rgba(0,0,0,0.3)",
        "btn-danger":
          "inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.4), 0 4px 0 #400003",
        "btn-danger-pressed":
          "inset -2px -2px 0 rgba(255,255,255,0.05), inset 2px 2px 0 rgba(0,0,0,0.4)",
        "input-inset": "inset 0 2px 0 #000, inset 2px 0 0 rgba(0,0,0,0.4)",
        card: "inset 2px 2px 0 rgba(255,255,255,0.08), inset -2px -2px 0 rgba(0,0,0,0.5)",
        "card-elevated":
          "inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.5), 4px 4px 0 #000",
      },
    },
  },
  plugins: [],
};

export default config;
