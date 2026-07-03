import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../components/Sidebar';

// Mock Next.js Link component using vanilla elements to avoid JSX parsing bugs
vi.mock('next/link', () => {
  return {
    default: ({ children, href, onClick }: any) => React.createElement('a', { href, onClick, 'data-testid': 'next-link' }, children),
  };
});

// Mock Lucide icons cleanly
vi.mock('lucide-react', () => ({
  X: () => React.createElement('span', null, 'X'),
  Coins: () => React.createElement('span', null, 'Coins'),
  KeyRound: () => React.createElement('span', null, 'KeyRound'),
  LogOut: () => React.createElement('span', null, 'LogOut'),
}));

describe('Sidebar Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onLogout: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(React.createElement(Sidebar, { ...defaultProps, isOpen: false }));
    expect(container.firstChild).toBeNull();
  });

  it('renders the sidebar menu and items when isOpen is true', () => {
    render(React.createElement(Sidebar, defaultProps));

    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Debts')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('renders a Change Password link pointing at /change-password and closes on click', () => {
    const onClose = vi.fn();
    render(React.createElement(Sidebar, { ...defaultProps, onClose }));

    const link = screen.getByText('Change Password').closest('a');
    expect(link).toHaveAttribute('href', '/change-password');

    fireEvent.click(link!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    render(React.createElement(Sidebar, defaultProps));

    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose and onLogout when the logout button is clicked', () => {
    render(React.createElement(Sidebar, defaultProps));

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });
});
