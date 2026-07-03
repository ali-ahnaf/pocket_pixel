import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeleteQuestModal } from "./DeleteQuestModal";

describe("DeleteQuestModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    questName: "Morning Workout",
    onDelete: () => {},
  };

  it("does not render anything when isOpen is false", () => {
    const { container } = render(
      <DeleteQuestModal {...baseProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal when isOpen is true", () => {
    render(<DeleteQuestModal {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: /delete quest/i })
    ).toBeInTheDocument();
  });

  it("displays the quest name in the confirmation message", () => {
    render(<DeleteQuestModal {...baseProps} questName="Read a book" />);
    expect(screen.getByText(/Read a book/)).toBeInTheDocument();
  });

  it("renders Cancel and Delete action buttons", () => {
    render(<DeleteQuestModal {...baseProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^delete$/i })
    ).toBeInTheDocument();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<DeleteQuestModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete and then closes when the Delete button is clicked", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    render(
      <DeleteQuestModal {...baseProps} onClose={onClose} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeleteQuestModal {...baseProps} onClose={onClose} />
    );
    const backdrop = container.querySelector(".fixed.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button (X) in the header is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeleteQuestModal {...baseProps} onClose={onClose} />
    );
    // Find the close button by locating the button in the header with the X icon
    const header = container.querySelector("header");
    const closeButton = header?.querySelector("button");
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
