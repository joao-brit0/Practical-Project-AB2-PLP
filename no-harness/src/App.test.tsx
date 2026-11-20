import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Reactive Connection Monitor', () => {
  it('exibe transicoes, notificacao e historico', () => {
    render(<App />)

    expect(screen.getByText('ONLINE')).toBeInTheDocument()

    fireEvent(window, new Event('offline'))
    expect(screen.getAllByText('OFFLINE').length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent('Conexão perdida')

    fireEvent(window, new Event('online'))
    expect(screen.getAllByText('ONLINE').length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent('Conexão restaurada')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
