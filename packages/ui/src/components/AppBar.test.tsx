import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBar } from './AppBar';

const { replaceMock, signOutMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  signOutMock: vi.fn().mockResolvedValue({ message: 'Signed out' }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/api', () => ({
  authApi: { signOut: signOutMock },
}));

describe('AppBar', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
    signOutMock.mockReset();
    signOutMock.mockResolvedValue({ message: 'Signed out' });
  });

  it('renders the app title and user controls', () => {
    render(<AppBar />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pocket pixel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument();
  });

  it('opens the sidebar when the menu button is clicked', () => {
    render(<AppBar />);

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument();
  });

  it('shows the logout action and clears storage on logout', async () => {
    localStorage.setItem('pocket_pixel_profile', JSON.stringify({ avatar: '/avatar.png' }));

    render(<AppBar />);

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(localStorage.getItem('pocket_pixel_profile')).toBeNull();
    });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/signin');
  });
});
