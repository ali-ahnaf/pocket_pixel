import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/api/ApiClient';
import AuthGuard from './AuthGuard';

const { replaceMock, pathnameMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: pathnameMock,
}));

vi.mock('@/components/PixelLoader', () => ({
  default: () => <div>Loading...</div>,
}));


describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
    pathnameMock.mockReset();
  });

  it('renders the loader while checking authentication', () => {
    pathnameMock.mockReturnValue('/dashboard');

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects authenticated users away from public pages', () => {
  pathnameMock.mockReturnValue('/signin');
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');

  render(
    <AuthGuard>
      <div>Protected Content</div>
    </AuthGuard>,
  );

  expect(replaceMock).toHaveBeenCalledWith('/');
});

it('redirects unauthenticated users from protected pages', () => {
  pathnameMock.mockReturnValue('/dashboard');

  localStorage.setItem('pocket_pixel_profile', JSON.stringify({ name: 'User' }));

  render(
    <AuthGuard>
      <div>Protected Content</div>
    </AuthGuard>,
  );

  expect(localStorage.getItem('pocket_pixel_profile')).toBeNull();
  expect(replaceMock).toHaveBeenCalledWith('/signin');
});

it('renders children when the user is authenticated on a protected page', () => {
  pathnameMock.mockReturnValue('/dashboard');
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');

  render(
    <AuthGuard>
      <div>Protected Content</div>
    </AuthGuard>,
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
  expect(replaceMock).not.toHaveBeenCalled();
});

});