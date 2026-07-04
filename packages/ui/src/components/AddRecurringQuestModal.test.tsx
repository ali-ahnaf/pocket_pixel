import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddRecurringQuestModal } from './AddRecurringQuestModal';
import type { TagDto, VaultDto } from '@expense-tracker/shared';

vi.mock('../lib/iconMapper', () => ({
  iconMapper: () => () => <div data-testid="icon" />,
}));

const mockTags: TagDto[] = [
  { id: 'tag-1', userId: 'user-1', name: 'Health', icon: 'Heart', backgroundColor: '#ff0000' },
  { id: 'tag-2', userId: 'user-1', name: 'Quest', icon: 'Sword', backgroundColor: '#00ff00' },
];

const mockVaults: VaultDto[] = [
  { id: 'vault-1', userId: 'user-1', name: 'Main Wallet', description: 'Primary', icon: 'Briefcase', backgroundColor: '#0000ff', isDefault: true, monthlyBudget: 500 },
  { id: 'vault-2', userId: 'user-1', name: 'Savings', description: 'Long term', icon: 'PiggyBank', backgroundColor: '#ffff00', isDefault: false, monthlyBudget: 1000 },
];

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'New Quest',
  availableTags: mockTags,
  availableVaults: mockVaults,
};

describe('AddRecurringQuestModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<AddRecurringQuestModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal when isOpen is true', () => {
    render(<AddRecurringQuestModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('heading', { name: /new quest/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Health Potion Subscription')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('Create Record')).toBeInTheDocument();
  });

  it('pre-fills fields and shows "Save Changes" in edit mode', () => {
    const initialData = {
      id: 'quest-1',
      title: 'Car Loan',
      amount: 500,
      type: 'EXPENSE',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      tagIds: ['tag-1'],
      vaultId: 'vault-1',
      frequency: 'Weekly',
    };

    render(<AddRecurringQuestModal {...baseProps} title="Edit Quest" initialData={initialData} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('heading', { name: /edit quest/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Health Potion Subscription')).toHaveValue('Car Loan');
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(500);
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-04-15')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('HEALTH')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AddRecurringQuestModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const header = screen.getByRole('heading', { name: /new quest/i }).closest('header');
    expect(header).not.toBeNull();
    fireEvent.click(within(header as HTMLElement).getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<AddRecurringQuestModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with correct details when creating', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AddRecurringQuestModal {...baseProps} onSave={onSave} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Health Potion Subscription'), { target: { value: 'Health Potion' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /income/i }));
    fireEvent.click(screen.getByRole('button', { name: /create record/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Health Potion',
        amount: 100,
        type: 'INCOME',
        frequency: 'Monthly',
        selectedInterval: 'Monthly',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with correct details when updating', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const initialData = {
      id: 'quest-1',
      title: 'Old Quest',
      amount: 200,
      type: 'EXPENSE',
      startDate: '2024-01-01',
      endDate: '2024-03-01',
      tagIds: [],
      vaultId: 'vault-1',
      frequency: 'Daily',
    };

    render(<AddRecurringQuestModal {...baseProps} onSave={onSave} onClose={onClose} title="Edit Quest" initialData={initialData} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Health Potion Subscription'), { target: { value: 'Updated Quest' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'quest-1',
        title: 'Updated Quest',
        amount: 300,
        type: 'EXPENSE',
        frequency: 'Daily',
        selectedInterval: 'Daily',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a vault from dropdown', () => {
    render(<AddRecurringQuestModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const vaultButton = screen.getByText('Main Wallet').closest('button');
    expect(vaultButton).not.toBeNull();
    fireEvent.click(vaultButton as Element);

    const savingsOption = screen.getByText('Savings').closest('button');
    expect(savingsOption).not.toBeNull();
    fireEvent.click(savingsOption as Element);

    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('allows selecting an interval from dropdown', () => {
    render(<AddRecurringQuestModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const intervalButton = screen.getByText('Monthly').closest('button');
    expect(intervalButton).not.toBeNull();
    fireEvent.click(intervalButton as Element);

    const weeklyOption = screen.getByText('Weekly').closest('button');
    expect(weeklyOption).not.toBeNull();
    fireEvent.click(weeklyOption as Element);

    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('allows selecting an existing tag', () => {
    render(<AddRecurringQuestModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const tagSuggestion = screen.getByText('HEALTH');
    expect(tagSuggestion).not.toBeNull();
    fireEvent.click(tagSuggestion);

    expect(screen.getByText('HEALTH')).toBeInTheDocument();
  });
});
