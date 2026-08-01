import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import '@testing-library/jest-dom';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders TokTickIT heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /TokTickIT/i });
    expect(heading).toBeInTheDocument();
  });

  it('shows loading then online status on a successful health check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', service: 'TokTickIT API' }),
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Online/i);
    });
  });

  it('shows a useful error message when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unable to reach the backend/i);
    });
  });
});
