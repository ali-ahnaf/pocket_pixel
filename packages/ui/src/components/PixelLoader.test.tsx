import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PixelLoader from "./PixelLoader";

describe("PixelLoader", () => {
  it("renders without crashing", () => {
    const { container } = render(<PixelLoader />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the Pocket Pixel title", () => {
    render(<PixelLoader />);
    expect(screen.getByText("Pocket Pixel")).toBeInTheDocument();
  });

  it("renders the LOADING text", () => {
    render(<PixelLoader />);
    expect(screen.getByText("LOADING...")).toBeInTheDocument();
  });

  it("renders the coin icon svg", () => {
    const { container } = render(<PixelLoader />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders eight loading blocks", () => {
    const { container } = render(<PixelLoader />);
    const loadingBlocks = container.querySelectorAll(
      ".flex-1.h-full.bg-\\[\\#a5d655\\]"
    );
    expect(loadingBlocks).toHaveLength(8);
  });

  it("renders with correct container styling", () => {
    const { container } = render(<PixelLoader />);
    const mainDiv = container.querySelector(".fixed.inset-0");
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass("bg-[#141315]", "flex", "flex-col");
  });

  it("renders scanline overlay", () => {
    const { container } = render(<PixelLoader />);
    const scanlineOverlay = container.querySelector(
      ".pointer-events-none.fixed.inset-0"
    );
    expect(scanlineOverlay).toBeInTheDocument();
  });

  it("has pixel-themed styling applied", () => {
    render(<PixelLoader />);
    const title = screen.getByText("Pocket Pixel");
    expect(title).toHaveClass("uppercase", "text-[#a5d655]");
  });

  it("displays correct text colors", () => {
    render(<PixelLoader />);
    const title = screen.getByText("Pocket Pixel");
    const loading = screen.getByText("LOADING...");
    expect(title).toHaveClass("text-[#a5d655]");
    expect(loading).toHaveClass("text-[#8d937f]");
  });

  it("renders animation style with keyframes", () => {
    const { container } = render(<PixelLoader />);
    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain("@keyframes pixel-blink");
  });

  it("applies fixed positioning for full viewport coverage", () => {
    const { container } = render(<PixelLoader />);
    const mainContainer = container.querySelector(".fixed.inset-0");
    expect(mainContainer).toHaveClass("z-50");
  });

  it("has z-index layering for overlay and content", () => {
    const { container } = render(<PixelLoader />);
    const mainDiv = container.querySelector(".fixed.inset-0");
    const contentDiv = container.querySelector(".relative.z-10");
    expect(mainDiv).toHaveClass("z-50");
    expect(contentDiv).toHaveClass("z-10");
  });

  it("renders centered flex layout", () => {
    const { container } = render(<PixelLoader />);
    const mainDiv = container.querySelector(".fixed.inset-0");
    expect(mainDiv).toHaveClass("flex", "items-center", "justify-center");
  });
});

