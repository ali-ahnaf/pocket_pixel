import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeleteVaultModal } from './DeleteVaultModal';

describe('DeleteVaultModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    vaultName: 'Entertainment',
    onDelete: () => {},
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<DeleteVaultModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal when isOpen is true', () => {
    render(<DeleteVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('heading', { name: /delete vault/i })).toBeInTheDocument();
  });

  it('displays the vault name in the confirmation message', () => {
    render(<DeleteVaultModal {...baseProps} vaultName="Gaming" />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByText(/Gaming/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<DeleteVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    const closeBtn = header!.querySelector('button');
    expect(closeBtn).not.toBeNull();

    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<DeleteVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });
    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows choosing different actions', () => {
    render(<DeleteVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const moveToDefaultBtn = screen.getByRole('button', { name: /move to default/i });
    const deleteAllBtn = screen.getByRole('button', { name: /delete all/i });

    // By default, move_transactions is selected. Let's click Delete All.
    fireEvent.click(deleteAllBtn);
    expect(deleteAllBtn).toHaveClass('bg-error-container');
    expect(moveToDefaultBtn).toHaveClass('bg-surface-container-lowest');

    // Click Move to Default again
    fireEvent.click(moveToDefaultBtn);
    expect(moveToDefaultBtn).toHaveClass('bg-secondary-container');
    expect(deleteAllBtn).toHaveClass('bg-surface-container-lowest');
  });

  it('calls onDelete with move_transactions by default when Confirm Delete is clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(<DeleteVaultModal {...baseProps} onDelete={onDelete} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    expect(onDelete).toHaveBeenCalledWith('move_transactions');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete with delete_transactions when chosen and Confirm Delete is clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(<DeleteVaultModal {...baseProps} onDelete={onDelete} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const deleteAllBtn = screen.getByRole('button', { name: /delete all/i });
    fireEvent.click(deleteAllBtn);

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    expect(onDelete).toHaveBeenCalledWith('delete_transactions');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
