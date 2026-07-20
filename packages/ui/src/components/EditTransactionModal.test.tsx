import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditTransactionModal } from './EditTransactionModal';

const { mockedGetTags, mockedGetVaults, mockedCreateTag, mockedUpdateTransaction, mockedDeleteTransaction } = vi.hoisted(() => ({
  mockedGetTags: vi.fn(),
  mockedGetVaults: vi.fn(),
  mockedCreateTag: vi.fn(),
  mockedUpdateTransaction: vi.fn(),
  mockedDeleteTransaction: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  profileApi: {
    getTags: mockedGetTags,
    getVaults: mockedGetVaults,
    createTag: mockedCreateTag,
    updateTransaction: mockedUpdateTransaction,
    deleteTransaction: mockedDeleteTransaction,
  },
}));

vi.mock('../lib/iconMapper', () => ({
  iconMapper: () => () => <div data-testid="vault-icon" />,
}));

vi.mock('./TransactionTypeToggle', () => ({
  TransactionTypeToggle: ({ isExpense, onChange }: { isExpense: boolean; onChange: (value: boolean) => void }) => (
    <div>
      <button type="button" onClick={() => onChange(true)} aria-pressed={isExpense}>
        Expense
      </button>
      <button type="button" onClick={() => onChange(false)} aria-pressed={!isExpense}>
        Income
      </button>
    </div>
  ),
}));

describe('EditTransactionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetTags.mockResolvedValue([]);
    mockedGetVaults.mockResolvedValue([]);
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    userId: 'user-1',
    transaction: {
      id: 'txn-1',
      userId: 'user-1',
      title: 'Dinner',
      amount: 42.5,
      type: 'expense' as const,
      date: '2024-01-15',
      vaultId: null,
      vault: null,
      tags: [],
      isCommitted: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deletedAt: null,
    },
  };

  it('does not render anything when closed', () => {
    const { container } = render(<EditTransactionModal {...baseProps} isOpen={false} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal heading and entry fields when opened', async () => {
    render(<EditTransactionModal {...baseProps} />);

    expect(await screen.findByRole('heading', { name: /edit transaction/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Grocery run')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument();
  });

  it('pre-fills the current transaction values', async () => {
    render(<EditTransactionModal {...baseProps} />);

    expect(await screen.findByDisplayValue('Dinner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('42.5')).toBeInTheDocument();
  });

  it('exposes a date picker pre-filled with the transaction date', async () => {
    render(<EditTransactionModal {...baseProps} />);

    expect(await screen.findByRole('button', { name: /change date/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<EditTransactionModal {...baseProps} onClose={onClose} />);

    await screen.findByRole('heading', { name: /edit transaction/i });

    const closeButton = container.querySelector('header button');
    expect(closeButton).not.toBeNull();

    fireEvent.click(closeButton as HTMLButtonElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits the updated amount and type when Save Changes is clicked', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mockedUpdateTransaction.mockResolvedValue({});

    render(<EditTransactionModal {...baseProps} onClose={onClose} onSuccess={onSuccess} />);

    const amountInput = await screen.findByDisplayValue('42.5');
    fireEvent.change(amountInput, { target: { value: '75' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedUpdateTransaction).toHaveBeenCalledTimes(1);
    });

    expect(mockedUpdateTransaction).toHaveBeenCalledWith(
      'user-1',
      'txn-1',
      expect.objectContaining({
        amount: 75,
        type: 'expense',
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a confirmation step before deleting and cancels back on Cancel', async () => {
    render(<EditTransactionModal {...baseProps} />);

    await screen.findByRole('heading', { name: /edit transaction/i });

    fireEvent.click(screen.getByRole('button', { name: /delete transaction/i }));

    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /delete transaction/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm delete/i })).not.toBeInTheDocument();
    expect(mockedDeleteTransaction).not.toHaveBeenCalled();
  });

  it('calls deleteTransaction when the delete is confirmed', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mockedDeleteTransaction.mockResolvedValue({});

    render(<EditTransactionModal {...baseProps} onClose={onClose} onSuccess={onSuccess} />);

    await screen.findByRole('heading', { name: /edit transaction/i });

    fireEvent.click(screen.getByRole('button', { name: /delete transaction/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(mockedDeleteTransaction).toHaveBeenCalledWith('user-1', 'txn-1');
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
