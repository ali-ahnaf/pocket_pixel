import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BottomNavBar } from './BottomNavBar';

// Mock next/navigation so we can control the current pathname per test
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link with a plain anchor to avoid Next.js router requirements
vi.mock('next/link', () => {
  return {
    default: ({ children, href, className }: any) => React.createElement('a', { href, className }, children),
  };
});

// Mock lucide-react icons with simple identifiable elements
vi.mock('lucide-react', () => ({
  Home: () => React.createElement('span', { 'data-testid': 'icon-home' }, 'Home'),
  User: () => React.createElement('span', { 'data-testid': 'icon-user' }, 'User'),
  BarChart: () => React.createElement('span', { 'data-testid': 'icon-barchart' }, 'BarChart'),
  Coins: () => React.createElement('span', { 'data-testid': 'icon-coins' }, 'Coins'),
}));

describe('BottomNavBar Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it('renders without crashing', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(React.createElement(BottomNavBar));
    expect(container.firstChild).not.toBeNull();
  });

  it('renders all four navigation items with correct labels', () => {
    mockUsePathname.mockReturnValue('/');
    render(React.createElement(BottomNavBar));

    expect(screen.getByText('HOME')).toBeInTheDocument();
    expect(screen.getByText('STATS')).toBeInTheDocument();
    expect(screen.getByText('DEBTS')).toBeInTheDocument();
    expect(screen.getByText('PROFILE')).toBeInTheDocument();
  });

  it('renders links with the correct href attributes', () => {
    mockUsePathname.mockReturnValue('/');
    render(React.createElement(BottomNavBar));

    expect(screen.getByText('HOME').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('STATS').closest('a')).toHaveAttribute('href', '/stats');
    expect(screen.getByText('DEBTS').closest('a')).toHaveAttribute('href', '/debts');
    expect(screen.getByText('PROFILE').closest('a')).toHaveAttribute('href', '/profile');
  });

  it('renders an icon for each navigation item', () => {
    mockUsePathname.mockReturnValue('/');
    render(React.createElement(BottomNavBar));

    expect(screen.getByTestId('icon-home')).toBeInTheDocument();
    expect(screen.getByTestId('icon-barchart')).toBeInTheDocument();
    expect(screen.getByTestId('icon-coins')).toBeInTheDocument();
    expect(screen.getByTestId('icon-user')).toBeInTheDocument();
  });

  it('marks HOME as active when pathname is "/"', () => {
    mockUsePathname.mockReturnValue('/');
    render(React.createElement(BottomNavBar));

    const homeLink = screen.getByText('HOME').closest('a');
    const statsLink = screen.getByText('STATS').closest('a');

    expect(homeLink?.className).toContain('bg-primary');
    expect(statsLink?.className).not.toContain('bg-primary');
  });

  it('marks STATS as active when pathname is "/stats"', () => {
    mockUsePathname.mockReturnValue('/stats');
    render(React.createElement(BottomNavBar));

    const homeLink = screen.getByText('HOME').closest('a');
    const statsLink = screen.getByText('STATS').closest('a');

    expect(statsLink?.className).toContain('bg-primary');
    expect(homeLink?.className).not.toContain('bg-primary');
  });

  it('marks a nested route as active via startsWith matching (e.g. "/debts/123")', () => {
    mockUsePathname.mockReturnValue('/debts/123');
    render(React.createElement(BottomNavBar));

    const debtsLink = screen.getByText('DEBTS').closest('a');
    const homeLink = screen.getByText('HOME').closest('a');

    expect(debtsLink?.className).toContain('bg-primary');
    // Home should not be active just because DEBTS starts with "/"
    expect(homeLink?.className).not.toContain('bg-primary');
  });

  it('does not treat HOME as active for unrelated routes', () => {
    mockUsePathname.mockReturnValue('/profile');
    render(React.createElement(BottomNavBar));

    const homeLink = screen.getByText('HOME').closest('a');
    const profileLink = screen.getByText('PROFILE').closest('a');

    expect(homeLink?.className).not.toContain('bg-primary');
    expect(profileLink?.className).toContain('bg-primary');
  });

  it('handles a trailing slash in the pathname correctly (e.g. "/stats/")', () => {
    mockUsePathname.mockReturnValue('/stats/');
    render(React.createElement(BottomNavBar));

    const statsLink = screen.getByText('STATS').closest('a');
    expect(statsLink?.className).toContain('bg-primary');
  });

  it('falls back to "/" when usePathname returns null or undefined', () => {
    mockUsePathname.mockReturnValue(null);
    render(React.createElement(BottomNavBar));

    const homeLink = screen.getByText('HOME').closest('a');
    expect(homeLink?.className).toContain('bg-primary');
  });
});
