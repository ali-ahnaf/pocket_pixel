import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// The modal imports a real API client (axios-based). Mock it so the component
// can be rendered in isolation. Tests use userId={null}, so no calls are made.
vi.mock("../lib/api", () => ({
  profileApi: {
    getTags: vi.fn().mockResolvedValue([]),
    getVaults: vi.fn().mockResolvedValue([]),
    sendPrompt: vi.fn(),
    createTag: vi.fn(),
    createTransaction: vi.fn(),
  },
}));

import { LogResourceModal } from "./LogResourceModal";

describe("LogResourceModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    userId: "user-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render anything when isOpen is false", () => {
    const { container } = render(
      <LogResourceModal {...baseProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal header when isOpen is true", () => {
    render(<LogResourceModal {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: /log new resource/i })
    ).toBeInTheDocument();
  });

  it("shows the AI prompt entry (Send) by default", () => {
    render(<LogResourceModal {...baseProps} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("e.g. Grocery run")
    ).not.toBeInTheDocument();
  });

  it("reveals the manual entry fields when Manual Entry is toggled", () => {
    render(<LogResourceModal {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /manual entry/i }));
    expect(
      screen.getByPlaceholderText("e.g. Grocery run")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /income/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /transfer/i })).toBeInTheDocument();
  });

  it("shows separate source and target vault pickers for transfers", async () => {
    const { profileApi } = await import("../lib/api");
    vi.mocked(profileApi.getVaults).mockResolvedValue([
      { id: "vault-1", name: "Cash", icon: "Wallet", backgroundColor: "#f59e0b", description: "", isDefault: true, monthlyBudget: null },
      { id: "vault-2", name: "Savings", icon: "PiggyBank", backgroundColor: "#10b981", description: "", isDefault: false, monthlyBudget: null },
    ] as never);

    render(<LogResourceModal {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /manual entry/i }));
    fireEvent.click(screen.getByRole("button", { name: /transfer/i }));

    await screen.findByRole("button", { name: /select source vault/i });
    await screen.findByRole("button", { name: /select target vault/i });
    expect(screen.queryByText(/select vault/i)).not.toBeInTheDocument();
  });

  it("submits transfer payload with source and target vaults", async () => {
    const { profileApi } = await import("../lib/api");
    vi.mocked(profileApi.getVaults).mockResolvedValue([
      { id: "vault-1", name: "Cash", icon: "Wallet", backgroundColor: "#f59e0b", description: "", isDefault: true, monthlyBudget: null },
      { id: "vault-2", name: "Savings", icon: "PiggyBank", backgroundColor: "#10b981", description: "", isDefault: false, monthlyBudget: null },
    ] as never);
    vi.mocked(profileApi.createTransaction).mockResolvedValue({ id: "txn-1" });

    render(<LogResourceModal {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /manual entry/i }));
    fireEvent.click(screen.getByRole("button", { name: /transfer/i }));

    const amountInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(amountInput, { target: { value: "35.5" } });

    const sourceButton = await screen.findByRole("button", { name: /select source vault/i });
    fireEvent.click(sourceButton);
    fireEvent.click(await screen.findByRole("button", { name: /cash/i }));

    const targetButton = await screen.findByRole("button", { name: /select target vault/i });
    fireEvent.click(targetButton);
    fireEvent.click(await screen.findByRole("button", { name: /savings/i }));

    fireEvent.click(screen.getByRole("button", { name: /record/i }));

    await waitFor(() => expect(profileApi.createTransaction).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        amount: 35.5,
        type: "transfer",
        sourceVaultId: "vault-1",
        targetVaultId: "vault-2",
      }),
    ));
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LogResourceModal {...baseProps} onClose={onClose} />
    );
    const closeButton = container.querySelector("header button");
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
