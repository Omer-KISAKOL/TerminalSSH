export const SECURITY_QUESTION_IDS = [
  'childhood-friend',
  'mother-maiden',
  'first-pet',
  'birth-city',
  'favorite-teacher',
] as const

export type SecurityQuestionId = (typeof SECURITY_QUESTION_IDS)[number]

export function isSecurityQuestionId(value: string): value is SecurityQuestionId {
  return (SECURITY_QUESTION_IDS as readonly string[]).includes(value)
}

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
}