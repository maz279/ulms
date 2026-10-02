import * as React from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Prototype page scaffolding (Front_end/css/app.css §07): breadcrumb trail
 * "Module › Screen", page title with optional badge, one-line gray subtitle,
 * and right-aligned action slot. Every console screen opens with this block
 * so the production build keeps the validated Dynamics-365 rhythm.
 */
export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader(props: {
  crumbs: Crumb[];
  title: string;
  sub?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  const { crumbs, title, sub, badge, actions } = props;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box aria-label="Breadcrumb" sx={{
        display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap",
        fontSize: 12.5, color: "text.secondary",
      }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={`${c.label}-${i}`}>
            {i > 0 && <Box component="span" aria-hidden sx={{ color: "#B9BED6" }}>›</Box>}
            {c.to
              ? <Link to={c.to} style={{ color: "inherit", textDecoration: "none" }}>{c.label}</Link>
              : <span>{c.label}</span>}
          </React.Fragment>
        ))}
      </Box>
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap",
        mt: 0.5, mb: sub || actions ? 0 : 0,
      }}>
        <Typography component="h1" sx={{
          fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2,
        }}>{title}</Typography>
        {badge && (
          <Box component="span" sx={{
            alignSelf: "center", fontSize: 10.5, fontWeight: 600, color: "text.secondary",
            border: "1px solid", borderColor: "divider", borderRadius: 999, px: 1, py: "1px",
            whiteSpace: "nowrap",
          }}>{badge}</Box>
        )}
        {actions && <Box sx={{ ml: "auto", display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
      </Box>
      {sub && (
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.25 }}>{sub}</Typography>
      )}
    </Box>
  );
}
