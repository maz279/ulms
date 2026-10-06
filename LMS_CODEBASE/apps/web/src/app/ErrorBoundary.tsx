import * as React from "react";

/**
 * Top-level React error boundary (audit R1 hardening). A render crash in any
 * route should surface a recoverable D365-style error state — not a blank
 * tab. The boundary intentionally lives above the Router so the user can
 * navigate Home via a plain anchor (full reload, clean state).
 */
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console -- ops signal until R8 wires telemetry
    console.error("[ULMS] render crash:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--canvas, #f5f5f7)", fontFamily: "system-ui, sans-serif" }}>
        <div className="card" style={{ maxWidth: 560, padding: 24, background: "#fff", border: "1px solid #e0e0e6", borderRadius: 10 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Something went wrong</h2>
          <p style={{ color: "#555", fontSize: 13.5, margin: "0 0 6px" }}>
            The screen failed to render. This is a defect — please report the route you were on.
          </p>
          <p className="mono" style={{ fontSize: 11.5, color: "#8a8a94", wordBreak: "break-word", margin: "0 0 16px" }}>
            {String(this.state.error?.message ?? this.state.error)}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="btn btn-primary" href="/home" style={{ textDecoration: "none" }}>Back to Home</a>
            <button className="btn btn-2nd" type="button" onClick={() => { this.setState({ error: null }); }}>Try again</button>
          </div>
        </div>
      </div>
    );
  }
}
