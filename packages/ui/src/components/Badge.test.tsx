import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>NEW</Badge>);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("uses the outline variant class by default", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("pixel-badge-outline");
  });

  it.each([
    ["primary", "pixel-badge-primary"],
    ["secondary", "pixel-badge-secondary"],
    ["tertiary", "pixel-badge-tertiary"],
    ["error", "pixel-badge-error"],
    ["outline", "pixel-badge-outline"],
  ] as const)("applies the %s variant class", (variant, className) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant)).toHaveClass(className);
  });

  it("merges a custom className with the variant class", () => {
    render(<Badge className="extra-class">Tagged</Badge>);
    const el = screen.getByText("Tagged");
    expect(el).toHaveClass("pixel-badge-outline");
    expect(el).toHaveClass("extra-class");
  });

  it("forwards standard span attributes", () => {
    render(
      <Badge data-testid="badge" title="hello">
        X
      </Badge>
    );
    expect(screen.getByTestId("badge")).toHaveAttribute("title", "hello");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Interactive</Badge>);

    fireEvent.click(screen.getByText("Interactive"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
