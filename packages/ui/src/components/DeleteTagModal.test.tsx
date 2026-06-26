import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeleteTagModal } from "./DeleteTagModal";

describe("DeleteTagModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    tagName: "Groceries",
    onDelete: () => {},
  };

  it("does not render anything when isOpen is false", () => {
    const { container } = render(
      <DeleteTagModal {...baseProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal when isOpen is true", () => {
    render(<DeleteTagModal {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: /delete tag/i })
    ).toBeInTheDocument();
  });

  it("displays the tag name in the confirmation message", () => {
    render(<DeleteTagModal {...baseProps} tagName="Travel" />);
    expect(screen.getByText(/Travel/)).toBeInTheDocument();
  });

  it("renders Cancel and Delete action buttons", () => {
    render(<DeleteTagModal {...baseProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^delete$/i })
    ).toBeInTheDocument();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<DeleteTagModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete and then closes when the Delete button is clicked", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    render(
      <DeleteTagModal {...baseProps} onClose={onClose} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeleteTagModal {...baseProps} onClose={onClose} />
    );
    const backdrop = container.querySelector(".fixed.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
