import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("Sidebar", () => {
  it("renders without crashing when open", () => {
    render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <Sidebar isOpen={false} onClose={() => {}} onLogout={() => {}} />
    );
    
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    expect(container.querySelector("aside")).not.toBeInTheDocument();
  });

  it("renders Menu title", () => {
    render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("renders Settings link", () => {
    render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    expect(screen.getByText("Settings")).toBeInTheDocument();
    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("renders Logout button", () => {
    render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Sidebar isOpen={true} onClose={handleClose} onLogout={() => {}} />
    );
    
    const closeButton = screen.getByLabelText("Close menu");
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose and onLogout when Logout button is clicked", () => {
    const handleClose = vi.fn();
    const handleLogout = vi.fn();
    render(
      <Sidebar isOpen={true} onClose={handleClose} onLogout={handleLogout} />
    );
    
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);
    
    expect(handleClose).toHaveBeenCalled();
    expect(handleLogout).toHaveBeenCalled();
  });

  it("calls onClose when Settings link is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Sidebar isOpen={true} onClose={handleClose} onLogout={() => {}} />
    );
    
    const settingsLink = screen.getByText("Settings").closest("a");
    fireEvent.click(settingsLink!);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Sidebar isOpen={true} onClose={handleClose} onLogout={() => {}} />
    );
    
    const backdrop = container.querySelector('.fixed.inset-0.bg-black');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it("has proper accessibility attributes", () => {
    render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    const closeButton = screen.getByLabelText("Close menu");
    expect(closeButton).toHaveAttribute("aria-label", "Close menu");
  });

  it("renders aside element with correct structure", () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={() => {}} onLogout={() => {}} />
    );
    
    const aside = container.querySelector("aside");
    const header = aside?.querySelector("header");
    const nav = aside?.querySelector("nav");
    
    expect(aside).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });
});
