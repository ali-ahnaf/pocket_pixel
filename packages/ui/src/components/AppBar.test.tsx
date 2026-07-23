import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBar } from './AppBar';

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

describe('AppBar', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
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

  it('shows the logout action and clears storage on logout', () => {
  localStorage.setItem('pocket_pixel_profile', JSON.stringify({ avatar: '/avatar.png' }));

  render(<AppBar />);
  fireEvent.click(screen.getByRole('button', { name: /open user menu/i }));
  fireEvent.click(screen.getByRole('button', { name: /logout/i }));

  expect(localStorage.getItem('pocket_pixel_profile')).toBeNull();
  expect(replaceMock).toHaveBeenCalledWith('/signin');
});
});
