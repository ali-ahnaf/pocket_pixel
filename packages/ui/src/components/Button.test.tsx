import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders without crashing", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders the children passed to it", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByText("Save changes")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Submit
      </Button>
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("applies the default variant and size classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });

    expect(button).toHaveClass("btn", "btn-primary", "btn-md");
  });

  it("applies the correct class for a given variant", () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toHaveClass("btn-danger");
  });

  it("applies the correct class for a given size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button", { name: "Large" });

    expect(button).toHaveClass("btn-lg");
  });

  it("merges a custom className with the default classes", () => {
    render(<Button className="w-full">Full width</Button>);
    const button = screen.getByRole("button", { name: "Full width" });

    expect(button).toHaveClass("btn", "w-full");
  });

  it("forwards native button props such as type and aria-label", () => {
    render(
      <Button type="submit" aria-label="submit-form">
        Go
      </Button>
    );
    const button = screen.getByRole("button", { name: "submit-form" });

    expect(button).toHaveAttribute("type", "submit");
  });
});