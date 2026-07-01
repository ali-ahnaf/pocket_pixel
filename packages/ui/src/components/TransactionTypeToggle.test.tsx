import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionTypeToggle } from './TransactionTypeToggle';

describe('TransactionTypeToggle', () => {
  it('renders both Expense and Income options', () => {
    render(<TransactionTypeToggle isExpense={true} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument();
  });

  it('highlights the Expense option when isExpense is true', () => {
    render(<TransactionTypeToggle isExpense={true} onChange={() => {}} />);
    const expenseBtn = screen.getByRole('button', { name: /expense/i });
    const incomeBtn = screen.getByRole('button', { name: /income/i });

    expect(expenseBtn).toHaveClass('bg-error-container');
    expect(incomeBtn).toHaveClass('bg-surface-container-low');
  });

  it('highlights the Income option when isExpense is false', () => {
    render(<TransactionTypeToggle isExpense={false} onChange={() => {}} />);
    const expenseBtn = screen.getByRole('button', { name: /expense/i });
    const incomeBtn = screen.getByRole('button', { name: /income/i });

    expect(expenseBtn).toHaveClass('bg-surface-container-low');
    expect(incomeBtn).toHaveClass('bg-primary-container');
  });

  it('calls onChange with true when the Expense button is clicked', () => {
    const onChange = vi.fn();
    render(<TransactionTypeToggle isExpense={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /expense/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when the Income button is clicked', () => {
    const onChange = vi.fn();
    render(<TransactionTypeToggle isExpense={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /income/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
