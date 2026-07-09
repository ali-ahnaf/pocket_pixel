import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeleteVaultModal } from './DeleteVaultModal';

describe('DeleteVaultModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    vaultName: 'Groceries',
    onDelete: () => {},
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('does not render anything when closed', () => {
    render(<DeleteVaultModal {...baseProps} isOpen={false} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByText('Delete Vault')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    render(<DeleteVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Delete Vault')).toBeInTheDocument();
    expect(screen.getByText('"Groceries"')).toBeInTheDocument();
  });

  it('selects Move to Default by default and switches selection when Delete All is clicked', () => {
    render(<DeleteVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const moveToDefaultButton = screen.getByText('Move to Default').closest('button');
    const deleteAllButton = screen.getByText('Delete All').closest('button');

    expect(moveToDefaultButton).not.toBeNull();
    expect(deleteAllButton).not.toBeNull();
    expect(moveToDefaultButton).toHaveClass('bg-secondary-container');
    expect(deleteAllButton).toHaveClass('bg-surface-container-lowest');

    fireEvent.click(deleteAllButton!);

    expect(deleteAllButton).toHaveClass('bg-error-container');
    expect(moveToDefaultButton).toHaveClass('bg-surface-container-lowest');
  });

  it("clicking Confirm Delete calls onDelete with the default action and calls onClose once", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(<DeleteVaultModal {...baseProps} onClose={onClose} onDelete={onDelete} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    expect(onDelete).toHaveBeenCalledWith('move_transactions');
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking Delete All then Confirm Delete calls onDelete with delete_transactions", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(<DeleteVaultModal {...baseProps} onClose={onClose} onDelete={onDelete} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByText('Delete All').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    expect(onDelete).toHaveBeenCalledWith('delete_transactions');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn();

    render(<DeleteVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((btn) => btn.querySelector('.lucide-x') || btn.className.includes('hover:bg-error-container'));
    expect(closeBtn).toBeDefined();

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('clicking the backdrop calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<DeleteVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
