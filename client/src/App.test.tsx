import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';
import '@testing-library/jest-dom';

describe('App', () => {
  it('renders TokTickIT heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /TokTickIT/i });
    expect(heading).toBeInTheDocument();
  });
});
