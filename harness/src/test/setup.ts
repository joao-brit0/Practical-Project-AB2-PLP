import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

Object.defineProperty(window.navigator, 'onLine', {
  configurable: true,
  value: true,
})

afterEach(() => cleanup())
