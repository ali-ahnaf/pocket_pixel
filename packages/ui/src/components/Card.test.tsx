import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("renders the title when provided", () => {
    render(<Card title="Profile">Content</Card>);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("does not render a title when none is provided", () => {
    render(<Card>Content</Card>);
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  it("uses the default card class", () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass("card");
  });

  it("uses the elevated class when elevated is true", () => {
    const { container } = render(<Card elevated>Elevated</Card>);
    expect(container.firstChild).toHaveClass("card-elevated");
  });

  it("merges a custom className with the default class", () => {
    const { container } = render(
      <Card className="extra-class">Styled</Card>
    );

    expect(container.firstChild).toHaveClass("card");
    expect(container.firstChild).toHaveClass("extra-class");
  });

  it("forwards standard div attributes", () => {
    render(
      <Card data-testid="card" id="profile-card">
        Content
      </Card>
    );

    expect(screen.getByTestId("card")).toHaveAttribute(
      "id",
      "profile-card"
    );
  });
});