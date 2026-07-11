import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders without crashing", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("renders with a label when provided", () => {
    render(<Input label="Email" />);
    
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders without a label when not provided", () => {
    const { container } = render(<Input />);
    
    const label = container.querySelector("label");
    expect(label).not.toBeInTheDocument();
  });

  it("generates a label id from label text when id is not provided", () => {
    render(<Input label="Full Name" id="test-input" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "test-input");
  });

  it("uses provided id when given", () => {
    render(<Input label="Username" id="custom-id" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("renders error message when error prop is provided", () => {
    render(<Input label="Password" error="Password is required" />);
    
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("does not render error message when error prop is not provided", () => {
    const { container } = render(<Input label="Email" />);
    
    const errorText = container.querySelector("p");
    expect(errorText).not.toBeInTheDocument();
  });

  it("applies error class to input when error is provided", () => {
    render(<Input label="Email" error="Invalid email" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-error");
  });

  it("does not apply error class to input when error is not provided", () => {
    render(<Input label="Email" />);
    
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveClass("border-error");
  });

  it("applies pixel-input class to input", () => {
    render(<Input />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pixel-input");
  });

  it("applies pixel-input-label class to label", () => {
    const { container } = render(<Input label="Test Label" />);
    
    const label = container.querySelector("label");
    expect(label).toHaveClass("pixel-input-label");
  });

  it("forwards HTML attributes to input element", () => {
    render(
      <Input
        label="Test Input"
        placeholder="Enter text"
        type="email"
        required
        disabled
      />
    );
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Enter text");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("required");
    expect(input).toBeDisabled();
  });

  it("accepts and applies custom className", () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveClass("pixel-input");
  });

  it("renders input with maxLength attribute", () => {
    render(<Input label="Code" maxLength={6} />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "6");
  });

  it("renders input with step attribute for number input", () => {
    render(<Input type="number" step="0.01" />);
    
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("step", "0.01");
  });
});
