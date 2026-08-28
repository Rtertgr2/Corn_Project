// web/tests/smoke.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PhoneView from '../src/views/PhoneView';
import { PhoneProvider } from '../src/PhoneContext';

describe('PhoneView', () => {
  it('renders phone input', () => {
    render(
      <MemoryRouter>
        <PhoneProvider>
          <PhoneView />
        </PhoneProvider>
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('0812345678')).toBeTruthy();
  });
});
