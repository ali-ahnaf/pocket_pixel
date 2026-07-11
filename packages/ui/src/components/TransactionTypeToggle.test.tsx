import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransactionTypeToggle } from "./TransactionTypeToggle";

describe("TransactionTypeToggle", () => {
  it("renders without crashing", () => {
    render(<TransactionTypeToggle isExpense={true} onChange={() => {}} />);
    
    expect(screen.getByRole("button", { name: /expense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /income/i })).toBeInTheDocument();
  });

  it("renders with Expense button highlighted when isExpense is true", () => {
    render(<TransactionTypeToggle isExpense={true} onChange={() => {}} />);
    
    const expenseButton = screen.getByRole("button", { name: /expense/i });
    const incomeButton = screen.getByRole("button", { name: /income/i });

    // Expense button should have the active styling
    expect(expenseButton).toHaveClass("bg-error-container");
    expect(incomeButton).toHaveClass("bg-surface-container-low");
  });

  it("renders with Income button highlighted when isExpense is false", () => {
    render(<TransactionTypeToggle isExpense={false} onChange={() => {}} />);
    
    const expenseButton = screen.getByRole("button", { name: /expense/i });
    const incomeButton = screen.getByRole("button", { name: /income/i });

    // Income button should have the active styling
    expect(incomeButton).toHaveClass("bg-primary-container");
    expect(expenseButton).toHaveClass("bg-surface-container-low");
  });

  it("calls onChange with true when Expense button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <TransactionTypeToggle isExpense={false} onChange={handleChange} />
    );

    const expenseButton = screen.getByRole("button", { name: /expense/i });
    fireEvent.click(expenseButton);

    expect(handleChange).toHaveBeenCalledWith(true);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("calls onChange with false when Income button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <TransactionTypeToggle isExpense={true} onChange={handleChange} />
    );

    const incomeButton = screen.getByRole("button", { name: /income/i });
    fireEvent.click(incomeButton);

    expect(handleChange).toHaveBeenCalledWith(false);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("displays icons alongside button text", () => {
    const { container } = render(
      <TransactionTypeToggle isExpense={true} onChange={() => {}} />
    );

    // Check that SVG icons are rendered (lucide-react icons)
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it("handles multiple clicks correctly", () => {
    const handleChange = vi.fn();
    render(
      <TransactionTypeToggle isExpense={true} onChange={handleChange} />
    );

    const expenseButton = screen.getByRole("button", { name: /expense/i });
    const incomeButton = screen.getByRole("button", { name: /income/i });

    fireEvent.click(incomeButton);
    fireEvent.click(expenseButton);
    fireEvent.click(incomeButton);

    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenNthCalledWith(1, false);
    expect(handleChange).toHaveBeenNthCalledWith(2, true);
    expect(handleChange).toHaveBeenNthCalledWith(3, false);
  });
});
