import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopSidebar } from './DesktopSidebar';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/api/ApiClient';

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('DesktopSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
  });

  it('shows a logout button that clears storage and redirects to signin', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    localStorage.setItem('pocket_pixel_profile', JSON.stringify({ id: '1', name: 'User' }));

    render(<DesktopSidebar name="User" email="user@example.com" avatar="/avatar.png" />);

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('pocket_pixel_profile')).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith('/signin');
  });
});
