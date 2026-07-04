import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AvatarPickerModal } from './AvatarPickerModal';
import { AVATARS } from '../lib/helpers/static';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Save: () => <span>Save</span>,
  User: () => <span>User</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}));

describe('AvatarPickerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentAvatar: AVATARS[0],
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when closed', () => {
    const { container } = render(<AvatarPickerModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when open', () => {
    render(<AvatarPickerModal {...defaultProps} />);
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('heading', { name: /select avatar/i })).toBeInTheDocument();

    // Check that first 6 avatars (page 0) are rendered
    const images = screen.getAllByAltText('Avatar option');
    expect(images).toHaveLength(6);

    // Check their src attributes match the first 6 static avatars
    for (let i = 0; i < 6; i++) {
      expect(images[i]).toHaveAttribute('src', AVATARS[i]);
    }
  });

  it('indicates currentAvatar as selected', () => {
    // Set current avatar to AVATARS[1]
    render(<AvatarPickerModal {...defaultProps} currentAvatar={AVATARS[1]} />);
    act(() => {
      vi.runAllTimers();
    });

    // Check which avatar has the active/selected style marker.
    // Inside AvatarPickerModal, the selected avatar has a Save icon (which we mocked to return <span>Save</span>).
    // The bottom button also contains a Save icon.
    // So there will be 2 'Save' texts in total (1 on the selected avatar, 1 on the Select Avatar action button).
    const saveIcons = screen.getAllByText('Save');
    expect(saveIcons).toHaveLength(2);
  });

  it('paginates to the next page and previous page when clicking chevron buttons', () => {
    render(<AvatarPickerModal {...defaultProps} />);
    act(() => {
      vi.runAllTimers();
    });

    // Verify first page of avatars (index 0 to 5)
    let images = screen.getAllByAltText('Avatar option');
    expect(images[0]).toHaveAttribute('src', AVATARS[0]);

    // Click next page
    const nextBtn = screen.getByText('ChevronRight').closest('button');
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn!);

    // Verify second page of avatars (index 6 to 11)
    images = screen.getAllByAltText('Avatar option');
    expect(images[0]).toHaveAttribute('src', AVATARS[6]);

    // Click previous page
    const prevBtn = screen.getByText('ChevronLeft').closest('button');
    expect(prevBtn).toBeInTheDocument();
    fireEvent.click(prevBtn!);

    // Verify back to first page
    images = screen.getAllByAltText('Avatar option');
    expect(images[0]).toHaveAttribute('src', AVATARS[0]);
  });

  it('paginates directly to a page when clicking page indicator dots', () => {
    const { container } = render(<AvatarPickerModal {...defaultProps} />);
    act(() => {
      vi.runAllTimers();
    });

    // Dot buttons are inside the pagination container (a div with class "flex gap-2")
    const dotButtons = container.querySelectorAll('.flex.gap-2 button');

    // There should be 3 dot buttons (14 total avatars / 6 per page = 3 pages)
    expect(dotButtons).toHaveLength(3);

    // Click the third dot (page index 2)
    fireEvent.click(dotButtons[2]);

    // Verify page 2 avatars (index 12 to 13)
    const images = screen.getAllByAltText('Avatar option');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', AVATARS[12]);
    expect(images[1]).toHaveAttribute('src', AVATARS[13]);
  });

  it('disables ChevronLeft on first page and ChevronRight on last page', () => {
    const { container } = render(<AvatarPickerModal {...defaultProps} />);
    act(() => {
      vi.runAllTimers();
    });

    const prevBtn = screen.getByText('ChevronLeft').closest('button');
    const nextBtn = screen.getByText('ChevronRight').closest('button');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Go to last page (page 2)
    const dotButtons = container.querySelectorAll('.flex.gap-2 button');
    fireEvent.click(dotButtons[2]);

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });

  it('calls onClose when clicking close button or backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<AvatarPickerModal {...defaultProps} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    // Click close button
    const closeBtn = screen.getByText('X').closest('button');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('updates selection state when clicking another avatar and triggers onSelect/onClose when saving', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<AvatarPickerModal {...defaultProps} onSelect={onSelect} onClose={onClose} />);
    act(() => {
      vi.runAllTimers();
    });

    // Click the third avatar (AVATARS[2])
    const avatarButtons = screen.getAllByAltText('Avatar option').map((img) => img.closest('button'));
    fireEvent.click(avatarButtons[2]!);

    // Save selection
    const saveBtn = screen.getByRole('button', { name: /select avatar/i });
    fireEvent.click(saveBtn);

    expect(onSelect).toHaveBeenCalledWith(AVATARS[2]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
