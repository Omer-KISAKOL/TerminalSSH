export const validationMessagesTr = {
  profileNameRequired: 'Profil adı boş olamaz.',
  hostRequired: 'Sunucu adresi boş olamaz.',
  portNumeric: 'Port geçerli bir sayı olmalı.',
  portRange: 'Port {min}–{max} arasında olmalı.',
  usernameRequired: 'Kullanıcı adı boş olamaz.',
  passwordRequired: 'Parola boş olamaz.',
  passwordSaveRequired: 'Parolayı kaydetmek için parola girilmeli.',
  privateKeyRequired: 'Özel anahtar dosyası seçilmeli.',
  passphraseSaveRequired: 'Passphrase kaydetmek için passphrase girilmeli.',
} as const

export const validationMessagesEn = {
  profileNameRequired: 'Profile name cannot be empty.',
  hostRequired: 'Server address cannot be empty.',
  portNumeric: 'Port must be a valid number.',
  portRange: 'Port must be between {min} and {max}.',
  usernameRequired: 'Username cannot be empty.',
  passwordRequired: 'Password cannot be empty.',
  passwordSaveRequired: 'Enter a password to save it.',
  privateKeyRequired: 'Select a private key file.',
  passphraseSaveRequired: 'Enter a passphrase to save it.',
} as const

export type ValidationMessages = {
  -readonly [K in keyof typeof validationMessagesTr]: string
}