import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { profileApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  profileApi: {
    createTransaction: vi.fn(),
  },
}));

describe('AdjustBalanceModal', () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    userId: 'user-123',
    currentNetYield: 500,
    selectedMonth: currentMonth,
    selectedYear: currentYear,
    vaultId: 'vault-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<AdjustBalanceModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders header and pre-fills target balance with currentNetYield', () => {
    render(<AdjustBalanceModal {...baseProps} />);
    expect(screen.getByRole('heading', { name: /adjust balance/i })).toBeInTheDocument();
    const input = screen.getByLabelText(/target net yield/i) as HTMLInputElement;
    expect(input.value).toBe('500');
  });

  it('creates an income transaction with vaultId when target > current', async () => {
    vi.mocked(profileApi.createTransaction).mockResolvedValue({ id: 'tx-1' });

    render(<AdjustBalanceModal {...baseProps} currentNetYield={500} />);
    const input = screen.getByLabelText(/target net yield/i);
    fireEvent.change(input, { target: { value: '800' } });

    expect(screen.getByText(/300\.00 \(Income\)/i)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /save adjustment/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileApi.createTransaction).toHaveBeenCalledWith('user-123', {
        amount: 300,
        type: 'income',
        title: 'Balance adjustment',
        vaultId: 'vault-123',
        date: undefined,
      });
      expect(baseProps.onSuccess).toHaveBeenCalledTimes(1);
      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('creates an expense transaction with vaultId when target < current', async () => {
    vi.mocked(profileApi.createTransaction).mockResolvedValue({ id: 'tx-2' });

    render(<AdjustBalanceModal {...baseProps} currentNetYield={500} />);
    const input = screen.getByLabelText(/target net yield/i);
    fireEvent.change(input, { target: { value: '200' } });

    expect(screen.getByText(/300\.00 \(Expense\)/i)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /save adjustment/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileApi.createTransaction).toHaveBeenCalledWith('user-123', {
        amount: 300,
        type: 'expense',
        title: 'Balance adjustment',
        vaultId: 'vault-123',
        date: undefined,
      });
      expect(baseProps.onSuccess).toHaveBeenCalledTimes(1);
      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('formats explicit date when selected month is not current month', async () => {
    vi.mocked(profileApi.createTransaction).mockResolvedValue({ id: 'tx-3' });

    render(<AdjustBalanceModal {...baseProps} currentNetYield={500} selectedMonth={0} selectedYear={2025} />);
    const input = screen.getByLabelText(/target net yield/i);
    fireEvent.change(input, { target: { value: '700' } });

    const saveButton = screen.getByRole('button', { name: /save adjustment/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileApi.createTransaction).toHaveBeenCalledWith('user-123', {
        amount: 200,
        type: 'income',
        title: 'Balance adjustment',
        vaultId: 'vault-123',
        date: '2025-01-01',
      });
    });
  });

  it('skips API call and closes modal when target === current', async () => {
    render(<AdjustBalanceModal {...baseProps} currentNetYield={500} />);
    const saveButton = screen.getByRole('button', { name: /save adjustment/i });
    fireEvent.click(saveButton);

    expect(profileApi.createTransaction).not.toHaveBeenCalled();
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button on empty or invalid input', () => {
    render(<AdjustBalanceModal {...baseProps} />);
    const input = screen.getByLabelText(/target net yield/i);
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save adjustment/i });
    expect(saveButton).toBeDisabled();
  });
});
