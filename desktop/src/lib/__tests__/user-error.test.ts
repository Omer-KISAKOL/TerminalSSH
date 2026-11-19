import { describe, expect, it } from 'vitest'

import { toUserErrorMessage } from '../user-error'

describe('toUserErrorMessage', () => {
  it('stack trace içeren hataları filtreler', () => {
    const error = new Error('Bağlantı kurulamadı.\n    at Object.connect (/app/dist-electron/index.js:10:5)')

    expect(toUserErrorMessage(error)).toBe('Bağlantı kurulamadı.')
  })

  it('kullanıcı dostu kısa mesajları korur', () => {
    expect(toUserErrorMessage(new Error('Kullanıcı adı veya parola hatalı.'))).toBe(
      'Kullanıcı adı veya parola hatalı.',
    )
  })

  it('electron ipc invoke sarmalayıcısını temizler', () => {
    const error = new Error(
      "Error invoking remote method 'auth:reset-password': Error: Güvenlik sorusunun cevabı hatalı.",
    )

    expect(toUserErrorMessage(error)).toBe('Güvenlik sorusunun cevabı hatalı.')
  })
})
