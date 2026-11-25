import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
);
