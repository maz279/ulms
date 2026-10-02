/**
 * ULMS theme — 1:1 port of the validated prototype design tokens
 * (Front_end/css/tokens.css "INDIGO-FLUENT", PLANNING/07 §2).
 * The 16-step indigo ramp becomes the MUI v7 palette; the same values are
 * injected as CSS custom properties so charts read them live (as the
 * prototype does) — one theme object, two consumption paths.
 */
import { createTheme } from "@mui/material/styles";

// 16-step indigo brand ramp (prototype tokens #0D1233 → #F0F2FB, key stops)
export const brand = {
  950: "#0D1233",
  900: "#141A45",
  800: "#1E2660",
  700: "#2A3689",
  600: "#3F51B5", // primary — prototype --primary
  500: "#5C6BC0",
  400: "#7986CB",
  300: "#9FA8DA",
  200: "#C5CAE9",
  100: "#E8EAF6",
  50: "#F0F2FB",
} as const;

export const tokens = {
  primary: brand[600],
  primaryDark: brand[800],
  canvas: "#FAFBFD",
  surface: "#FFFFFF",
  line: "#E1E5F2",
  ink900: "#0B0E1A",
  ink700: "#424242",
  ink500: "#757575",
  status: {
    ok: "#107C10",
    warn: "#F7630C",
    err: "#C50F1F",
    info: "#3F51B5",
  },
  // BRPD 15/2024 stage colors (prototype .b-std0 … .b-bl)
  brpd: ["#107C10", "#256025", "#8A6D1A", "#B27C0A", "#B34F0A", "#A4300F", "#8C2B2F"],
} as const;

export const ulmsTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: tokens.primary, dark: tokens.primaryDark },
    background: { default: tokens.canvas, paper: tokens.surface },
    text: { primary: tokens.ink900, secondary: tokens.ink500 },
    success: { main: tokens.status.ok },
    warning: { main: tokens.status.warn },
    error: { main: tokens.status.err },
    divider: tokens.line,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: 'Inter, "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    // Prototype statusbar/tab sizes carried over; fluid scale preserved via rem
    fontSize: 13,
    h6: { fontSize: "1rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.8125rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: "0.8125rem" },
        head: {
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: tokens.ink500,
          whiteSpace: "nowrap",
        },
      },
    },
    // Prototype table chrome (app.css .dt th): light header fill, small-caps
    // gray label — applied theme-wide so every list/grid follows the contract.
    MuiTableHead: {
      styleOverrides: {
        root: { background: "#F7F8FC" },
      },
    },
    MuiChip: { styleOverrides: { root: { fontSize: "0.75rem" } } },
  },
});

/** Prototype shell geometry (48px topbar etc.) as CSS vars for layout use. */
export const shellGeometry = {
  topbarH: 48,
  sitemapW: 248,
  statusbarH: 28,
} as const;
