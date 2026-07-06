import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiscardDebtModal } from './DiscardDebtModal';

describe('DiscardDebtModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    debtTitle: 'Rent',
    onDiscard: () => {},
  };

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<DiscardDebtModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal when isOpen is true', () => {
    render(<DiscardDebtModal {...baseProps} />);
    expect(screen.getByRole('heading', { name: /discard due/i })).toBeInTheDocument();
  });

  it('displays the debt title in the confirmation message', () => {
    render(<DiscardDebtModal {...baseProps} debtTitle="Car Loan" />);
    expect(screen.getByText(/Car Loan/)).toBeInTheDocument();
  });

  it('renders Cancel and Discard action buttons', () => {
    render(<DiscardDebtModal {...baseProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^discard$/i })).toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<DiscardDebtModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard and then closes when the Discard button is clicked', () => {
    const onClose = vi.fn();
    const onDiscard = vi.fn();
    render(<DiscardDebtModal {...baseProps} onClose={onClose} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByRole('button', { name: /^discard$/i }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<DiscardDebtModal {...baseProps} onClose={onClose} />);
    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
