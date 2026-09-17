import { describe, expect, it } from 'vitest'

import {
  MAX_PORT,
  MAX_TERMINAL_COLS,
  MAX_TERMINAL_ROWS,
  MIN_PORT,
  MIN_TERMINAL_COLS,
  MIN_TERMINAL_ROWS,
} from '@shared/constants/validation'

import {
  assertConnectRequest,
  assertDisconnectPayload,
  assertResizePayload,
  assertWritePayload,
  IpcValidationError,
} from '../ssh'

const validConnectRequest = {
  host: 'example.com',
  port: 22,
  username: 'user',
  authType: 'password' as const,
  password: 'secret',
  cols: 80,
  rows: 24,
}

describe('assertConnectRequest', () => {
  it('geçerli isteği kabul eder', () => {
    expect(assertConnectRequest(validConnectRequest)).toEqual(validConnectRequest)
  })

  it('port sınırlarını doğrular', () => {
    expect(() => assertConnectRequest({ ...validConnectRequest, port: MIN_PORT - 1 })).toThrow(
      IpcValidationError,
    )
    expect(() => assertConnectRequest({ ...validConnectRequest, port: MAX_PORT + 1 })).toThrow(
      IpcValidationError,
    )
  })

  it('terminal boyut sınırlarını doğrular', () => {
    expect(() =>
      assertConnectRequest({ ...validConnectRequest, cols: MIN_TERMINAL_COLS - 1 }),
    ).toThrow(IpcValidationError)
    expect(() =>
      assertConnectRequest({ ...validConnectRequest, rows: MAX_TERMINAL_ROWS + 1 }),
    ).toThrow(IpcValidationError)
  })
})

describe('assertWritePayload', () => {
  it('sessionId ve data doğrular', () => {
    expect(assertWritePayload({ sessionId: 'abc', data: 'ls\n' })).toEqual({
      sessionId: 'abc',
      data: 'ls\n',
    })
  })
})

describe('assertResizePayload', () => {
  it('terminal boyut sınırlarını doğrular', () => {
    expect(assertResizePayload({ sessionId: 'abc', cols: 120, rows: 40 })).toEqual({
      sessionId: 'abc',
      cols: 120,
      rows: 40,
    })

    expect(() =>
      assertResizePayload({ sessionId: 'abc', cols: MAX_TERMINAL_COLS + 1, rows: 24 }),
    ).toThrow(IpcValidationError)
    expect(() =>
      assertResizePayload({ sessionId: 'abc', cols: 80, rows: MIN_TERMINAL_ROWS - 1 }),
    ).toThrow(IpcValidationError)
  })
})

describe('assertDisconnectPayload', () => {
  it('sessionId doğrular', () => {
    expect(assertDisconnectPayload({ sessionId: 'session-1' })).toEqual({
      sessionId: 'session-1',
    })
  })
})
