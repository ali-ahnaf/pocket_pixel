import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteVaultModal } from './DeleteVaultModal';

describe('DeleteVaultModal', () => {
  const vaultName = 'Groceries Vault';
  let onClose: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onDelete = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <DeleteVaultModal
        isOpen={false}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText('Delete Vault')).not.toBeInTheDocument();
  });

  it('renders the modal with the vault name when isOpen is true', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Delete Vault')).toBeInTheDocument();
    expect(screen.getByText(`"${vaultName}"`)).toBeInTheDocument();
  });

  it('renders both transaction handling options', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Move to Default')).toBeInTheDocument();
    expect(screen.getByText('Delete All')).toBeInTheDocument();
  });

  it('defaults to the "Move to Default" action', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('move_transactions');
  });

  it('switches to "Delete All" when that option is selected and confirmed', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete All'));

    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('delete_transactions');
  });

  it('calls onClose after confirming deletion', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close (X) button is clicked', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    // The close button is the only button in the header without visible text.
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.textContent === '');

    expect(closeButton).toBeDefined();
    fireEvent.click(closeButton as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const { container } = render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/70');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles the selected option styling when clicking between the two actions', () => {
    render(
      <DeleteVaultModal
        isOpen={true}
        onClose={onClose}
        vaultName={vaultName}
        onDelete={onDelete}
      />
    );

    const moveOption = screen.getByText('Move to Default').closest('button');
    const deleteOption = screen.getByText('Delete All').closest('button');

    expect(moveOption).toHaveClass('bg-secondary-container');
    expect(deleteOption).not.toHaveClass('bg-error-container');

    fireEvent.click(deleteOption as HTMLElement);

    expect(deleteOption).toHaveClass('bg-error-container');
    expect(moveOption).not.toHaveClass('bg-secondary-container');
  });
});
