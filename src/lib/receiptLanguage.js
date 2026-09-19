/**
 * Resolve ISO 639-1 language code from receipt.language.
 * Missing/invalid/low confidence → fallback "en".
 */
export function getReceiptLanguageCode(receiptData) {
  const language = receiptData?.language;

  if (typeof language === 'string') {
    const code = language.trim().toLowerCase();
    return /^[a-z]{2}$/.test(code) ? code : 'en';
  }

  if (!language || typeof language !== 'object') {
    return 'en';
  }

  if (language.confidence === 'low') {
    return 'en';
  }

  const code =
    typeof language.code === 'string' ? language.code.trim().toLowerCase() : '';
  if (!code || !/^[a-z]{2}$/.test(code)) {
    return 'en';
  }

  return code;
}

/** BCP 47 locale for dates / Intl from ISO 639-1 code. */
export function languageCodeToLocale(code) {
  const map = {
    id: 'id-ID',
    en: 'en-US',
    ja: 'ja-JP',
  };
  return map[code] || 'en-US';
}
