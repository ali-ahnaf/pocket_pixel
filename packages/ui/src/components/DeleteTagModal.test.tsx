import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeleteTagModal } from "./DeleteTagModal";

describe("DeleteTagModal", () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    tagName: "Groceries",
    onDelete: vi.fn(),
  });

  it("does not render when isOpen is false", () => {
    const props = createProps();

    const { container } = render(
      <DeleteTagModal {...props} isOpen={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal when open", () => {
    const props = createProps();

    render(<DeleteTagModal {...props} />);

    expect(
      screen.getByRole("heading", { name: /delete tag/i })
    ).toBeInTheDocument();
  });

  it("shows the selected tag name", () => {
    const props = createProps();

    render(
      <DeleteTagModal
        {...props}
        tagName="Travel"
      />
    );

    expect(screen.getByText(/travel/i)).toBeInTheDocument();
  });

  it("renders Cancel and Delete buttons", () => {
    const props = createProps();

    render(<DeleteTagModal {...props} />);

    expect(
      screen.getByRole("button", { name: /cancel/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^delete$/i })
    ).toBeInTheDocument();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    const props = createProps();

    render(<DeleteTagModal {...props} />);

    fireEvent.click(
      screen.getByRole("button", { name: /cancel/i })
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete and onClose when the Delete button is clicked", () => {
    const props = createProps();

    render(<DeleteTagModal {...props} />);

    fireEvent.click(
      screen.getByRole("button", { name: /^delete$/i })
    );

    expect(props.onDelete).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const props = createProps();

    const { container } = render(
      <DeleteTagModal {...props} />
    );

    const backdrop = container.querySelector(".fixed.inset-0");

    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop as Element);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close (X) button is clicked", () => {
    const props = createProps();

    render(<DeleteTagModal {...props} />);

    const buttons = screen.getAllByRole("button");

    // First button is the close (X) button in the header
    fireEvent.click(buttons[0]);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});