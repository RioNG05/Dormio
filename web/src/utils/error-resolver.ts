import { ApiError } from '@/services/api'

/**
 * Resolves an error caught from an API call into a localized display string.
 * Uses the business error code (err.code) to lookup translations in the `errors` namespace.
 * Passes dynamic variables (e.g. requiredTier, maxAllowed, currentTier) to i18n placeholders.
 *
 * @param err The caught error object
 * @param tErrors The translation function for the `errors` namespace: useTranslations('errors')
 * @param fallbackMessage Optional custom fallback message if the code is unknown
 * @returns Fully localized error message
 */
export function resolveErrorMessage(
  err: unknown,
  tErrors: (key: string, values?: Record<string, any>) => string,
  fallbackMessage?: string,
): string {
  if (err instanceof ApiError) {
    // 1. If backend returned a business error code, resolve via i18n
    if (err.code) {
      const dynamicParams = (err.data && typeof err.data === 'object' ? err.data : {}) as Record<
        string,
        any
      >
      const translated = tErrors(err.code, dynamicParams)
      // Check if translation exists (does not return the key itself)
      if (translated && translated !== err.code) {
        return translated
      }
    }

    // 2. If backend returned validation errors array from class-validator
    const errData = err.data as Record<string, any> | undefined
    if (Array.isArray(errData?.message) && errData.message.length > 0) {
      return errData.message.join('. ')
    }

    // 3. Fallback to provided message if given
    if (fallbackMessage) {
      return fallbackMessage
    }

    // 4. Fallback to err.message if it's not a generic HTTP failure text
    if (err.message && !err.message.startsWith('Request failed with status')) {
      return err.message
    }
  }

  if (err instanceof Error && err.message) {
    if (fallbackMessage) {
      return fallbackMessage
    }
    return err.message
  }

  return fallbackMessage || tErrors('COMMON_INTERNAL_ERROR')
}

