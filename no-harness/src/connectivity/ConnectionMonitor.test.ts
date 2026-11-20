import { describe, expect, it, vi } from 'vitest'
import { ConnectionMonitor, type ConnectionEventSource } from './ConnectionMonitor'

function createEventSource(onLine: boolean) {
  const listeners = new Map<'online' | 'offline', Set<() => void>>([
    ['online', new Set()],
    ['offline', new Set()],
  ])

  const eventSource: ConnectionEventSource & { emit: (type: 'online' | 'offline') => void } = {
    onLine,
    addEventListener: vi.fn((type, listener) => listeners.get(type)?.add(listener)),
    removeEventListener: vi.fn((type, listener) => listeners.get(type)?.delete(listener)),
    emit(type) {
      listeners.get(type)?.forEach((listener) => listener())
    },
  }

  return eventSource
}

describe('ConnectionMonitor', () => {
  it('inicializa com o estado atual da conexão', () => {
    expect(new ConnectionMonitor(createEventSource(true)).getSnapshot().status).toBe('ONLINE')
    expect(new ConnectionMonitor(createEventSource(false)).getSnapshot().status).toBe('OFFLINE')
  })

  it('transiciona de ONLINE para OFFLINE e registra o evento', () => {
    const eventSource = createEventSource(true)
    const monitor = new ConnectionMonitor(eventSource)
    monitor.start()

    eventSource.emit('offline')

    expect(monitor.getSnapshot().status).toBe('OFFLINE')
    expect(monitor.getSnapshot().history).toHaveLength(1)
  })

  it('transiciona de OFFLINE para ONLINE e registra o evento', () => {
    const eventSource = createEventSource(false)
    const monitor = new ConnectionMonitor(eventSource)
    monitor.start()

    eventSource.emit('online')

    expect(monitor.getSnapshot().status).toBe('ONLINE')
    expect(monitor.getSnapshot().history[0]).toMatchObject({ status: 'ONLINE' })
  })

  it('gera notificações nas mudanças de estado', () => {
    const eventSource = createEventSource(true)
    const monitor = new ConnectionMonitor(eventSource)
    monitor.start()

    eventSource.emit('offline')
    expect(monitor.getSnapshot().notification?.message).toBe('Conexão perdida')

    eventSource.emit('online')
    expect(monitor.getSnapshot().notification?.message).toBe('Conexão restaurada')
  })

  it('mantém o histórico das mudanças', () => {
    const eventSource = createEventSource(true)
    const monitor = new ConnectionMonitor(eventSource)
    monitor.start()

    eventSource.emit('offline')
    eventSource.emit('offline')
    eventSource.emit('online')

    expect(monitor.getSnapshot().history.map((event) => event.status)).toEqual([
      'ONLINE',
      'OFFLINE',
    ])
  })

  it('registra cada tipo de evento uma única vez', () => {
    const eventSource = createEventSource(true)
    const monitor = new ConnectionMonitor(eventSource)

    monitor.start()
    monitor.start()

    expect(eventSource.addEventListener).toHaveBeenCalledTimes(2)
  })
})
