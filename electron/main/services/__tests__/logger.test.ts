import { beforeEach, describe, expect, it, vi } from 'vitest'

const isPackagedMock = vi.hoisted(() => ({ value: false }))

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return isPackagedMock.value
    },
  },
}))

import { logger } from '../logger'

describe('logger', () => {
  beforeEach(() => {
    isPackagedMock.value = false
    vi.restoreAllMocks()
  })

  it('production modunda hassas alanları log meta içinde maskelemez ama mesajı sade tutar', () => {
    isPackagedMock.value = true
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    logger.info('SSH bağlantısı', {
      host: 'example.com',
      password: 'secret',
      privateKeyPath: '/home/user/.ssh/id_rsa',
    })

    expect(infoSpy).toHaveBeenCalledWith('SSH bağlantısı')
  })

  it('development modunda izin verilen alanları meta ile yazar', () => {
    isPackagedMock.value = false
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    logger.debug('Oturum', { sessionId: 'abc', password: 'secret' })

    expect(debugSpy).toHaveBeenCalledOnce()
    const message = debugSpy.mock.calls[0]?.[0] as string
    expect(message).toContain('sessionId')
    expect(message).toContain('[REDACTED]')
    expect(message).not.toContain('secret')
  })
})
