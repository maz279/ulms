/**
 * ErrorBoundary proof (verification iteration) — a crashing subtree must
 * surface the recoverable error card, not a blank tab. jsdom environment
 * because this renders real DOM.
 */
import { describe, it, expect, vi } from "vitest";
// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ErrorBoundary } from "@/app/ErrorBoundary";

function Boomer({ boom }: { boom: boolean }): React.JSX.Element {
  if (boom) throw new Error("kaboom-screen-defect");
  return <p>healthy</p>;
}

describe("ErrorBoundary (audit R1)", () => {
  it("renders children when healthy", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(<ErrorBoundary><Boomer boom={false} /></ErrorBoundary>);
    });
    expect(host.textContent).toContain("healthy");
    host.remove();
  });

  it("traps a render crash into the recoverable card with route report", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(<ErrorBoundary><Boomer boom={false} /></ErrorBoundary>);
    });
    // remount the same tree with the crash flipped on — same boundary instance
    act(() => {
      root.render(<ErrorBoundary><Boomer boom /></ErrorBoundary>);
    });
    expect(host.textContent).toContain("Something went wrong");
    expect(host.textContent).toContain("kaboom-screen-defect");
    expect(host.querySelector("a.btn-primary")?.getAttribute("href")).toBe("/home");
    errSpy.mockRestore();
    host.remove();
  });
});
