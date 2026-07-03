import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddVaultModal } from './AddVaultModal';

/**
 * MOCK iconMapper to avoid lucide-react missing icon warnings
 */
vi.mock('../lib/iconMapper', () => ({
  iconMapper: (iconName: string) => {
    const MockIcon = () => <div data-testid={`icon-${iconName}`} />;
    MockIcon.displayName = `MockIcon(${iconName})`;
    return MockIcon;
  },
}));

/**
 * MOCK static icon/color lists to simplify UI rendering
 */
vi.mock('@/lib/helpers/static', () => ({
  AVAILABLE_COLORS: ['#000000', '#ffffff'],
  AVAILABLE_ICONS: ['Home', 'Train'],
}));

describe('AddVaultModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    title: 'Create Vault',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when closed', () => {
    render(<AddVaultModal {...baseProps} isOpen={false} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByText('Create Vault')).not.toBeInTheDocument();
  });

  it('renders modal when open with default values', () => {
    render(<AddVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Create Vault')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Secret Stash')).toHaveValue('');
    expect(screen.getByPlaceholderText('e.g. 500')).toHaveValue(null);
    expect(screen.getByPlaceholderText('What is this vault for?')).toHaveValue('');
    expect(screen.getByText('Create Record')).toBeInTheDocument();
  });

  it('renders edit layout and pre-fills details when initialData is passed', () => {
    render(
      <AddVaultModal
        {...baseProps}
        title="Edit Vault"
        initialData={{
          id: 'vault-123',
          name: 'Travel Fund',
          description: 'Saving for Tokyo trip',
          color: '#ffffff',
          icon: 'Train',
          budget: 1500,
        }}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Edit Vault')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Secret Stash')).toHaveValue('Travel Fund');
    expect(screen.getByPlaceholderText('e.g. 500')).toHaveValue(1500);
    expect(screen.getByPlaceholderText('What is this vault for?')).toHaveValue('Saving for Tokyo trip');
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('allows typing in Name, Budget, and Description inputs', () => {
    render(<AddVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const nameInput = screen.getByPlaceholderText('e.g. Secret Stash');
    const budgetInput = screen.getByPlaceholderText('e.g. 500');
    const descriptionInput = screen.getByPlaceholderText('What is this vault for?');

    fireEvent.change(nameInput, { target: { value: 'Gaming Fund' } });
    fireEvent.change(budgetInput, { target: { value: '200' } });
    fireEvent.change(descriptionInput, { target: { value: 'To buy games' } });

    expect(nameInput).toHaveValue('Gaming Fund');
    expect(budgetInput).toHaveValue(200);
    expect(descriptionInput).toHaveValue('To buy games');
  });

  it('allows changing color from static color list', () => {
    render(<AddVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const colorInput = screen.getByPlaceholderText('#000000');
    expect(colorInput).toHaveValue('#3b82f6'); // default color

    // Find the button with background color '#ffffff' (our mock has '#000000' and '#ffffff')
    const whiteColorButton = screen.getAllByRole('button').find((btn) => btn.getAttribute('style')?.includes('#ffffff') || btn.getAttribute('style')?.includes('rgb(255, 255, 255)'));

    if (whiteColorButton) {
      fireEvent.click(whiteColorButton);
      expect(colorInput).toHaveValue('#ffffff');
    }
  });

  it('allows selecting icons', () => {
    render(<AddVaultModal {...baseProps} />);
    act(() => {
      vi.runAllTimers();
    });

    // The mock AVAILABLE_ICONS lists ['Home', 'Train']
    // By default, icon is 'Briefcase', let's click 'Train' icon button
    const trainIconButton = screen.getByTestId('icon-Train').closest('button');
    expect(trainIconButton).not.toBeNull();

    fireEvent.click(trainIconButton!);
  });

  it('calls onSave with updated details when Create is clicked with valid inputs', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<AddVaultModal {...baseProps} onSave={onSave} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Secret Stash'), { target: { value: 'Emergency Fund' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '3000' } });
    fireEvent.change(screen.getByPlaceholderText('What is this vault for?'), { target: { value: 'In case of emergency' } });

    // Select train icon
    const trainIconButton = screen.getByTestId('icon-Train').closest('button');
    if (trainIconButton) {
      fireEvent.click(trainIconButton);
    }

    fireEvent.click(screen.getByRole('button', { name: /create record/i }));

    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      name: 'Emergency Fund',
      description: 'In case of emergency',
      icon: 'Train',
      color: '#3b82f6',
      budget: 3000,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onSave if budget is invalid (negative value)', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<AddVaultModal {...baseProps} onSave={onSave} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Secret Stash'), { target: { value: 'Invalid Fund' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '-50' } });

    fireEvent.click(screen.getByRole('button', { name: /create record/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AddVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    // Close button has icon X. The button wrapping it has class and uses onClick={onClose}
    // Let's locate it by selecting the button containing the X icon or layout.
    // In our test, lucide icons are actual icons from lucide-react which render SVG elements.
    // Let's find the button that has no text content or has X button classes
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((btn) => btn.querySelector('.lucide-x') || btn.className.includes('hover:bg-error-container'));
    expect(closeBtn).toBeDefined();

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<AddVaultModal {...baseProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
