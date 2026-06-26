import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders without crashing", () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole("progressbar")).toBeDefined();
  });

  it("sets aria-valuenow and aria-valuemax correctly", () => {
    render(<ProgressBar value={30} max={200} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("30");
    expect(bar.getAttribute("aria-valuemax")).toBe("200");
  });

  it("renders 16 blocks total", () => {
    const { container } = render(<ProgressBar value={50} />);
    const blocks = container.querySelectorAll(".progress-block");
    expect(blocks.length).toBe(16);
  });

  it("fills correct number of blocks at 50%", () => {
    const { container } = render(<ProgressBar value={50} max={100} />);
    const blocks = container.querySelectorAll(".progress-block");
    const filled = Array.from(blocks).filter(b =>
      b.className.includes("bg-primary")
    );
    expect(filled.length).toBe(8);
  });

  it("fills all blocks at 100%", () => {
    const { container } = render(<ProgressBar value={100} max={100} />);
    const blocks = container.querySelectorAll(".progress-block");
    const filled = Array.from(blocks).filter(b =>
      b.className.includes("bg-primary")
    );
    expect(filled.length).toBe(16);
  });

  it("fills no blocks at 0%", () => {
    const { container } = render(<ProgressBar value={0} max={100} />);
    const blocks = container.querySelectorAll(".progress-block");
    const filled = Array.from(blocks).filter(b =>
      b.className.includes("bg-primary")
    );
    expect(filled.length).toBe(0);
  });

  it("clamps value above max to 100%", () => {
    const { container } = render(<ProgressBar value={200} max={100} />);
    const blocks = container.querySelectorAll(".progress-block");
    const filled = Array.from(blocks).filter(b =>
      b.className.includes("bg-primary")
    );
    expect(filled.length).toBe(16);
  });

  it("clamps negative value to 0%", () => {
    const { container } = render(<ProgressBar value={-10} max={100} />);
    const blocks = container.querySelectorAll(".progress-block");
    const filled = Array.from(blocks).filter(b =>
      b.className.includes("bg-primary")
    );
    expect(filled.length).toBe(0);
  });

  it("renders label when provided", () => {
    render(<ProgressBar value={50} label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders value display when showValue is true", () => {
    render(<ProgressBar value={30} max={100} showValue />);
    expect(screen.getByText("30/100")).toBeDefined();
  });

  it("does not render label or value when not provided", () => {
    render(<ProgressBar value={50} />);
    expect(screen.queryByText("30/100")).toBeNull();
  });

  it("applies error variant color", () => {
    const { container } = render(<ProgressBar value={100} variant="error" />);
    const filled = container.querySelectorAll(".bg-error");
    expect(filled.length).toBe(16);
  });
});