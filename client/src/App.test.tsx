import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import '@testing-library/jest-dom';

const HEALTH_RESPONSE = { status: 'ok', service: 'TokTickIT API' };
const CATEGORIES_RESPONSE = [
  { id: 1, name: 'Account and Access' },
  { id: 2, name: 'Hardware' },
  { id: 3, name: 'Software' },
  { id: 4, name: 'Network' },
];

function mockFetchImplementation(url: string) {
  if (url.includes('/api/health')) {
    return Promise.resolve({ ok: true, json: async () => HEALTH_RESPONSE });
  }
  if (url.includes('/api/categories')) {
    return Promise.resolve({ ok: true, json: async () => CATEGORIES_RESPONSE });
  }
  return Promise.reject(new Error(`Unexpected fetch url: ${url}`));
}

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
    vi.stubGlobal('fetch', vi.fn().mockImplementation(mockFetchImplementation));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    expect(screen.getByText(/^⏳ Loading\.\.\.$/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/System Status: Online/i)).toBeInTheDocument();
    });
  });

  it('shows a useful error message when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to reach the backend/i)).toBeInTheDocument();
    });
  });

  it('loads and displays the category list from the API, not hard-coded values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(mockFetchImplementation));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    expect(screen.getByText(/^⏳ Loading categories\.\.\.$/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('• Account and Access')).toBeInTheDocument();
    });
    expect(screen.getByText('• Hardware')).toBeInTheDocument();
    expect(screen.getByText('• Software')).toBeInTheDocument();
    expect(screen.getByText('• Network')).toBeInTheDocument();
  });

  it('shows a useful error message when the category list fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/categories')) return Promise.reject(new Error('Network error'));
        return mockFetchImplementation(url);
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check System/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to load request categories/i)).toBeInTheDocument();
    });
  });
});
