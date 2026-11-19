import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(8, 'Parola en az 8 karakter olmalıdır.'),
  deviceName: z.string().max(120).optional(),
  securityQuestionId: z.enum(
    ['childhood-friend', 'mother-maiden', 'first-pet', 'birth-city', 'favorite-teacher'],
    {
      errorMap: () => ({ message: 'Geçerli bir güvenlik sorusu seçin.' }),
    },
  ),
  securityAnswer: z
    .string()
    .trim()
    .min(2, 'Güvenlik cevabı en az 2 karakter olmalıdır.')
    .max(120, 'Güvenlik cevabı çok uzun.'),
})

export const passwordResetQuestionSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
})

export const passwordResetConfirmSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  securityAnswer: z
    .string()
    .trim()
    .min(2, 'Güvenlik cevabı gerekli.')
    .max(120, 'Güvenlik cevabı çok uzun.'),
  newPassword: z.string().min(8, 'Parola en az 8 karakter olmalıdır.'),
})

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Parola gerekli.'),
  deviceName: z.string().max(120).optional(),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const securityQuestionAnswerSchema = {
  securityQuestionId: z.enum(
    ['childhood-friend', 'mother-maiden', 'first-pet', 'birth-city', 'favorite-teacher'],
    {
      errorMap: () => ({ message: 'Geçerli bir güvenlik sorusu seçin.' }),
    },
  ),
  securityAnswer: z
    .string()
    .trim()
    .min(2, 'Güvenlik cevabı en az 2 karakter olmalıdır.')
    .max(120, 'Güvenlik cevabı çok uzun.'),
}

export const securitySetupWithTokenSchema = z.object({
  setupToken: z.string().min(1, 'Kurulum belirteci gerekli.'),
  deviceName: z.string().max(120).optional(),
  ...securityQuestionAnswerSchema,
})

export const securitySetupAuthenticatedSchema = z.object({
  ...securityQuestionAnswerSchema,
})

export const profileInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1).max(120),
  authType: z.enum(['password', 'privateKey']),
  savePassword: z.boolean(),
  savePassphrase: z.boolean(),
  password: z.string().optional().nullable(),
  passphrase: z.string().optional().nullable(),
  privateKey: z.string().optional().nullable(),
  lastConnectedAt: z.string().datetime().optional().nullable(),
})

export const snippetInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  content: z.string().max(100_000),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
})

export const syncSchema = z.object({
  profiles: z.array(
    profileInputSchema.extend({
      id: z.string().uuid(),
      updatedAt: z.string().datetime(),
      deletedAt: z.string().datetime().optional().nullable(),
    }),
  ),
})
