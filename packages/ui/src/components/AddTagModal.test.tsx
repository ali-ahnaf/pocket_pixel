import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddTagModal } from "./AddTagModal";

/**
 * MOCK iconMapper to avoid lucide-react missing icon warnings
 */
vi.mock("../lib/iconMapper", () => ({
  iconMapper: () => () => <div data-testid="icon" />,
}));

/**
 * MOCK static icon/color lists to simplify UI rendering
 */
vi.mock("@/lib/helpers/static", () => ({
  AVAILABLE_COLORS: ["#000000", "#ffffff"],
  AVAILABLE_ICONS: ["Home", "Train"],
}));

describe("AddTagModal", () => {
  it("does not render when closed", () => {
    render(
      <AddTagModal
        isOpen={false}
        onClose={() => {}}
        title="Add Tag"
      />
    );

    expect(screen.queryByText("Add Tag")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    render(
      <AddTagModal
        isOpen={true}
        onClose={() => {}}
        title="Add Tag"
      />
    );

    expect(screen.getByText("Add Tag")).toBeInTheDocument();
  });

  it("allows typing in name input", () => {
    render(
      <AddTagModal
        isOpen={true}
        onClose={() => {}}
        title="Add Tag"
      />
    );

    const input = screen.getByPlaceholderText("e.g. Groceries");
    fireEvent.change(input, { target: { value: "Food" } });

    expect((input as HTMLInputElement).value).toBe("Food");
  });

  it("calls onSave and onClose when Save is clicked", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <AddTagModal
        isOpen={true}
        onClose={onClose}
        title="Add Tag"
        onSave={onSave}
      />
    );

    const input = screen.getByPlaceholderText("e.g. Groceries");
    fireEvent.change(input, { target: { value: "Food" } });

    fireEvent.click(screen.getByText("Create Tag"));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Save Changes in edit mode", () => {
    render(
      <AddTagModal
        isOpen={true}
        onClose={() => {}}
        title="Edit Tag"
        initialData={{
          id: "1",
          name: "Food",
          color: "#000000",
          icon: "Home",
        }}
      />
    );

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });
});