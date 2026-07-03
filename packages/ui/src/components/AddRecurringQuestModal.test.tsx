
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddRecurringQuestModal } from './AddRecurringQuestModal';
import { render, screen, fireEvent, act } from '@testing-library/react';


describe('AddRecurringQuestModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    title: 'Add Recurring Quest',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render anything when isOpen is false', () => {
  const { container } = render(
    <AddRecurringQuestModal
      {...baseProps}
      isOpen={false}
    />
  );

  act(() => {
    vi.runAllTimers();
  });

  expect(container).toBeEmptyDOMElement();
});



it('renders the modal when isOpen is true', () => {
  render(<AddRecurringQuestModal {...baseProps} />);

  act(() => {
    vi.runAllTimers();
  });

  expect(
    screen.getByRole('heading', {
      name: /add recurring quest/i,
    }),
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText(/health potion subscription/i),
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', {
      name: /create record/i,
    }),
  ).toBeInTheDocument();
});


it('calls onClose when the close button is clicked', () => {
  const onClose = vi.fn();

  render(
    <AddRecurringQuestModal
      {...baseProps}
      onClose={onClose}
    />,
  );

  act(() => {
    vi.runAllTimers();
  });

  const buttons = screen.getAllByRole('button');

  // close button is the first button in header in this component
  fireEvent.click(buttons[0]);

  expect(onClose).toHaveBeenCalledTimes(1);
});



});

