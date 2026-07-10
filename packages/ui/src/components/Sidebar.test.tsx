import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';

// The component uses next/link, which relies on Next.js internals that
// aren't needed for these unit tests. Mocking it keeps the tests fast and
// isolated from the Next.js router/runtime.
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

describe('Sidebar', () => {
  const onClose = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onLogout.mockClear();
  });

  it('renders nothing in the DOM when isOpen is false', () => {
    render(<Sidebar isOpen={false} onClose={onClose} onLogout={onLogout} />);
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('renders the menu heading, nav link, and logout button when isOpen is true', async () => {
    render(<Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />);

    // The component delays adding the "visible" class by ~20ms, so wait for it.
    expect(await screen.findByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Debts')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /debts/i })).toHaveAttribute('href', '/debts');
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('calls onClose when the close (X) button is clicked', async () => {
    render(<Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />);
    await screen.findByText('Menu');

    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop overlay is clicked', async () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />
    );
    await screen.findByText('Menu');

    const overlay = container.querySelector('div.fixed.inset-0');
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Debts nav link is clicked', async () => {
    render(<Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />);
    await screen.findByText('Menu');

    fireEvent.click(screen.getByRole('link', { name: /debts/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls both onClose and onLogout when the logout button is clicked', async () => {
    render(<Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />);
    await screen.findByText('Menu');

    fireEvent.click(screen.getByText('Logout'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('removes the sidebar from the DOM after the closing animation finishes', async () => {
    const { rerender } = render(
      <Sidebar isOpen={true} onClose={onClose} onLogout={onLogout} />
    );
    await screen.findByText('Menu');

    rerender(<Sidebar isOpen={false} onClose={onClose} onLogout={onLogout} />);

    // The exit transition takes ~300ms, so the content should still be
    // present immediately after the prop flips.
    expect(screen.getByText('Menu')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Menu')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
