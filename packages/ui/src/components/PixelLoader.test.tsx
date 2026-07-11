import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PixelLoader from "./PixelLoader";

describe("PixelLoader", () => {
  it("renders without crashing", () => {
    const { container } = render(<PixelLoader />);
    expect(container).toBeInTheDocument();
  });

  it("renders the Pocket Pixel title", () => {
    render(<PixelLoader />);
    
    expect(screen.getByText("Pocket Pixel")).toBeInTheDocument();
  });

  it("renders the LOADING text", () => {
    render(<PixelLoader />);
    
    expect(screen.getByText("LOADING...")).toBeInTheDocument();
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

  it("renders coin icon SVG", () => {
    const { container } = render(<PixelLoader />);
    
    const coinIcon = container.querySelector(".w-16.h-16");
    expect(coinIcon).toBeInTheDocument();
    expect(coinIcon).toHaveClass("bg-[#a5d655]");
  });

  it("renders progress bar with multiple segments", () => {
    const { container } = render(<PixelLoader />);
    
    // Find the progress bar container and count animated segments
    const progressBarContainer = container.querySelector(".w-48");
    expect(progressBarContainer).toBeInTheDocument();
    
    // Check that it contains multiple child divs (the animated segments)
    const children = progressBarContainer?.children;
    expect(children && children.length > 0).toBe(true);
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

  it("renders style tag with animation keyframes", () => {
    const { container } = render(<PixelLoader />);
    
    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain("pixel-blink");
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
