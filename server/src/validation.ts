import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(8, 'Parola en az 8 karakter olmalıdır.'),
  deviceName: z.string().max(120).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Parola gerekli.'),
  deviceName: z.string().max(120).optional(),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
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

export const syncSchema = z.object({
  profiles: z.array(
    profileInputSchema.extend({
      id: z.string().uuid(),
      updatedAt: z.string().datetime(),
      deletedAt: z.string().datetime().optional().nullable(),
    }),
  ),
})
