import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddDebtModal } from './AddDebtModal';
import type { DebtDto } from '@expense-tracker/shared';

describe('AddDebtModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    onSave: () => {},
  };

  const mockDebt: DebtDto = {
    id: 'debt-1',
    userId: 'user-1',
    title: 'Car Loan',
    amount: 500,
    type: 'expense',
    notes: 'Monthly car payment',
    dueDate: '2026-08-15',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<AddDebtModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders "New Due" layout when isOpen is true and no debt is passed', () => {
    render(<AddDebtModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('heading', { name: /new due/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i)).toHaveValue('');
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(null);
    expect(screen.getByRole('button', { name: /save due/i })).toBeDisabled();
  });

  it('renders "Edit Due" layout and pre-fills details when a debt is passed', () => {
    render(<AddDebtModal {...baseProps} debt={mockDebt} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('heading', { name: /edit due/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i)).toHaveValue('Car Loan');
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(500);
    expect(screen.getByPlaceholderText(/e.g - Borrowed for concert tickets/i)).toHaveValue('Monthly car payment');
    expect(screen.getByRole('button', { name: /update due/i })).not.toBeDisabled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AddDebtModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<AddDebtModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enables save button only when name and amount are valid', () => {
    render(<AddDebtModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const saveBtn = screen.getByRole('button', { name: /save due/i });
    expect(saveBtn).toBeDisabled();

    // Type name only
    const nameInput = screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i);
    fireEvent.change(nameInput, { target: { value: 'Phone Bill' } });
    expect(saveBtn).toBeDisabled();

    // Type amount only
    fireEvent.change(nameInput, { target: { value: '' } });
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '50' } });
    expect(saveBtn).toBeDisabled();

    // Type both
    fireEvent.change(nameInput, { target: { value: 'Phone Bill' } });
    expect(saveBtn).not.toBeDisabled();
  });

  it('calls onSave with correct details when creating a new due', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AddDebtModal {...baseProps} onSave={onSave} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const nameInput = screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i);
    const amountInput = screen.getByPlaceholderText('0.00');
    const notesInput = screen.getByPlaceholderText(/e.g - Borrowed for concert tickets/i);
    const saveBtn = screen.getByRole('button', { name: /save due/i });

    fireEvent.change(nameInput, { target: { value: 'House Rent' } });
    fireEvent.change(amountInput, { target: { value: '1200' } });
    fireEvent.change(notesInput, { target: { value: 'Pay by 5th' } });

    // Toggle type to income (default is expense)
    const incomeToggleBtn = screen.getByRole('button', { name: /income/i });
    fireEvent.click(incomeToggleBtn);

    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith({
      title: 'House Rent',
      amount: 1200,
      type: 'income',
      notes: 'Pay by 5th',
      dueDate: null,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with correct details when updating an existing due', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AddDebtModal {...baseProps} debt={mockDebt} onSave={onSave} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const nameInput = screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i);
    const amountInput = screen.getByPlaceholderText('0.00');
    const updateBtn = screen.getByRole('button', { name: /update due/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Car Loan' } });
    fireEvent.change(amountInput, { target: { value: '550' } });

    fireEvent.click(updateBtn);

    expect(onSave).toHaveBeenCalledWith({
      title: 'Updated Car Loan',
      amount: 550,
      type: 'expense',
      notes: 'Monthly car payment',
      dueDate: '2026-08-15',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pre-fills the due date input with the DD/MM/YYYY display value when editing', () => {
    render(<AddDebtModal {...baseProps} debt={mockDebt} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByLabelText(/due date/i)).toHaveValue('15/08/2026');
  });

  it('sends the picked due date through onSave', () => {
    vi.setSystemTime(new Date(2026, 8, 1));
    const onSave = vi.fn();
    render(<AddDebtModal {...baseProps} onSave={onSave} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.change(screen.getByPlaceholderText(/e.g. Rent, Loan Repayment/i), { target: { value: 'Rent' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });

    // Open the pixel date picker and select today (system time fixed to 2026-09-01).
    fireEvent.click(screen.getByRole('button', { name: /change date/i }));
    fireEvent.click(screen.getByRole('button', { name: /^today$/i }));

    fireEvent.click(screen.getByRole('button', { name: /save due/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ dueDate: '2026-09-01' }));
  });

  it('sends dueDate as null when the date is cleared while editing', () => {
    const onSave = vi.fn();
    render(<AddDebtModal {...baseProps} debt={mockDebt} onSave={onSave} />);
    act(() => {
      vi.runAllTimers();
    });

    // Open the pixel date picker and clear the selected date.
    fireEvent.click(screen.getByRole('button', { name: /change date/i }));
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));

    fireEvent.click(screen.getByRole('button', { name: /update due/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ dueDate: null }));
  });
});
