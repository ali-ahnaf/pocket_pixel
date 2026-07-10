import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders the input without crashing', () => {
    render(<Input placeholder="Amount" />);

    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
  });

  it('renders a label when label is passed and omits it when label is not passed', () => {
    const { rerender, container } = render(<Input label="Amount" />);

    expect(screen.getByText('Amount').tagName).toBe('LABEL');

    rerender(<Input />);

    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  it('automatically generates a matching id and htmlFor from the label text', () => {
    render(<Input label="Monthly Budget" />);

    const input = screen.getByRole('textbox', { name: 'Monthly Budget' });
    const label = screen.getByText('Monthly Budget');

    expect(input).toHaveAttribute('id', 'monthly-budget');
    expect(label).toHaveAttribute('for', 'monthly-budget');
  });

  it('uses an explicit id when one is provided', () => {
    render(<Input id="custom-amount" label="Monthly Budget" />);

    const input = screen.getByRole('textbox', { name: 'Monthly Budget' });
    const label = screen.getByText('Monthly Budget');

    expect(input).toHaveAttribute('id', 'custom-amount');
    expect(input).not.toHaveAttribute('id', 'monthly-budget');
    expect(label).toHaveAttribute('for', 'custom-amount');
  });

  it('renders the error message text when error is passed', () => {
    render(<Input error="Amount is required" />);

    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('does not render an error message when error is not passed', () => {
    const { container } = render(<Input />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('forwards standard input props and updates value when typing', () => {
    render(<Input label="Amount" placeholder="Enter amount" />);

    const input = screen.getByRole('textbox', { name: 'Amount' });
    fireEvent.change(input, { target: { value: '125' } });

    expect(input).toHaveValue('125');
    expect(input).toHaveAttribute('placeholder', 'Enter amount');
  });

  it('applies extra className in addition to the default pixel-input class', () => {
    render(<Input className="custom-input" placeholder="Amount" />);

    const input = screen.getByPlaceholderText('Amount');

    expect(input).toHaveClass('pixel-input');
    expect(input).toHaveClass('custom-input');
  });
});
