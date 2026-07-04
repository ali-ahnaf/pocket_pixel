import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
//Adding tests for ServiceWorkerRegistration!
describe('ServiceWorkerRegistration', () => {
  let registerMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
      },
    });

    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });

  it('registers the service worker immediately when document is complete', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete',
    });

    render(<ServiceWorkerRegistration />);

    expect(registerMock).toHaveBeenCalledTimes(1);
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it('adds a load listener when document is still loading', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });

    render(<ServiceWorkerRegistration />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('removes the load listener on unmount', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });

    const { unmount } = render(<ServiceWorkerRegistration />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );
  });

  it('logs an error when registration fails', async () => {
    const error = new Error('Registration failed');

    registerMock.mockRejectedValueOnce(error);

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete',
    });

    render(<ServiceWorkerRegistration />);

    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});