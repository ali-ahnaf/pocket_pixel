import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopSidebar } from './DesktopSidebar';

const { replaceMock, signOutMock, pathnameState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  signOutMock: vi.fn(),
  pathnameState: { value: '/' },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signOut: signOutMock,
  }),
}));

describe('DesktopSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
    signOutMock.mockReset();
    pathnameState.value = '/';
  });

  it('renders all navigation links', () => {
    render(
      <DesktopSidebar
        name="User"
        email="user@example.com"
        avatar="/avatar.png"
      />
    );

    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /stats/i }).getAttribute('href')).toBe('/stats');
    expect(screen.getByRole('link', { name: /profile/i }).getAttribute('href')).toBe('/profile');
    expect(screen.getByRole('link', { name: /debts/i }).getAttribute('href')).toBe('/debts');
    expect(screen.getByRole('link', { name: /settings/i }).getAttribute('href')).toBe('/settings');
  });

  it('marks the current route as active', () => {
    pathnameState.value = '/stats';

    render(
      <DesktopSidebar
        name="User"
        email="user@example.com"
        avatar="/avatar.png"
      />
    );

    expect(
      screen.getByRole('link', { name: /stats/i }).getAttribute('aria-current')
    ).toBe('page');

    expect(
      screen.getByRole('link', { name: /home/i }).hasAttribute('aria-current')
    ).toBe(false);
  });

  it('displays profile information from props', () => {
    render(
      <DesktopSidebar
        name="Arshad"
        email="arshad@example.com"
        avatar="/avatar.png"
      />
    );

    expect(screen.getByText('Arshad')).toBeTruthy();
    expect(screen.getByText('arshad@example.com')).toBeTruthy();

    const avatar = screen.getByAltText('Player Avatar');

    expect(avatar.getAttribute('src')).toBe('/avatar.png');
  });

  it('loads profile information from localStorage when props are absent', async () => {
    localStorage.setItem(
      'pocket_pixel_profile',
      JSON.stringify({
        name: 'Stored User',
        email: 'stored@example.com',
        avatar: '/stored-avatar.png',
      })
    );

    render(<DesktopSidebar />);

    await waitFor(() => {
      expect(screen.getByText('Stored User')).toBeTruthy();
      expect(screen.getByText('stored@example.com')).toBeTruthy();
    });

    expect(
      screen.getByAltText('Player Avatar').getAttribute('src')
    ).toBe('/stored-avatar.png');
  });

  it('signs out and redirects to signin when logout is clicked', () => {
    render(
      <DesktopSidebar
        name="User"
        email="user@example.com"
        avatar="/avatar.png"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/signin');
  });
});