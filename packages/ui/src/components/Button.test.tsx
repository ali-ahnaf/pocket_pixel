import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies the primary variant and md size classes by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('btn-md');
  });

  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['tertiary', 'btn-tertiary'],
    ['ghost', 'btn-ghost'],
    ['danger', 'btn-danger'],
  ] as const)('applies the %s variant class', (variant, className) => {
    render(<Button variant={variant}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass(className);
  });

  it.each([
    ['sm', 'btn-sm'],
    ['md', 'btn-md'],
    ['lg', 'btn-lg'],
  ] as const)('applies the %s size class', (size, className) => {
    render(<Button size={size}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass(className);
  });

  it('merges custom className with default classes', () => {
    render(<Button className="custom-class">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards standard HTML button attributes', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled type="submit" onClick={handleClick}>
        Submit
      </Button>,
    );
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');

    // Clicking disabled button shouldn't trigger handler
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
