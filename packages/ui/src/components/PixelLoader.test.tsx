import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PixelLoader from './PixelLoader';

describe('PixelLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(<PixelLoader />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the application title', () => {
    render(<PixelLoader />);

    expect(screen.getByText('Pocket Pixel')).toBeInTheDocument();
  });

  it('renders the loading text', () => {
    render(<PixelLoader />);

    expect(screen.getByText('LOADING...')).toBeInTheDocument();
  });

  it('renders the loading icon', () => {
    const { container } = render(<PixelLoader />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders eight loading blocks', () => {
    const { container } = render(<PixelLoader />);

    const loadingBlocks = container.querySelectorAll(
      '.flex-1.h-full.bg-\\[\\#a5d655\\]'
    );

    expect(loadingBlocks).toHaveLength(8);
  });

  it('renders animation styles', () => {
    const { container } = render(<PixelLoader />);

    const style = container.querySelector('style');

    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain('@keyframes pixel-blink');
  });
});