const ZERO_DECIMAL = new Set(['IDR', 'JPY', 'KRW', 'VND']);

function isValidCurrencyCode(code) {
  return typeof code === 'string' && /^[A-Z]{3}$/.test(code.trim().toUpperCase());
}

/**
 * Parse money from API/UI values.
 * Handles ID thousand dots: "12.000" → 12000, "191.475" → 191475
 * and decimal commas: "12.000,50" → 12000.5
 */
export function parseMoneyAmount(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    // Recover values that were misparsed as decimals (191.475 → 191475).
    // Integers like 12 stay as-is; unit price can be repaired via line total.
    if (!Number.isInteger(value)) {
      const asString = String(value);
      if (/^-?\d+\.\d{3}$/.test(asString)) {
        return Math.round(value * 1000);
      }
    }
    return value;
  }
  if (value == null || value === '') return 0;

  let raw = String(value).trim();
  if (!raw) return 0;

  raw = raw.replace(/[^\d.,\-]/g, '');
  if (!raw || raw === '-' || raw === '.' || raw === ',') return 0;

  const negative = raw.startsWith('-');
  if (negative) raw = raw.slice(1);

  let normalized = raw;

  if (raw.includes(',') && raw.includes('.')) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      // ID: 12.000,50
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 12,000.50
      normalized = raw.replace(/,/g, '');
    }
  } else if (raw.includes(',')) {
    const parts = raw.split(',');
    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      // Decimal comma: 12,5
      normalized = `${parts[0].replace(/\./g, '')}.${parts[1]}`;
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (raw.includes('.')) {
    const parts = raw.split('.');
    const allNumeric = parts.every((part) => /^\d*$/.test(part));
    if (
      allNumeric &&
      (parts.length > 2 || (parts.length === 2 && parts[1].length === 3))
    ) {
      // Thousand separators: 12.000 or 1.234.567
      normalized = raw.replace(/\./g, '');
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

/**
 * Resolve ISO 4217 code from receipt currency object.
 * Empty/invalid code or confidence === "low" → fallback IDR.
 */
export function getReceiptCurrency(receiptData) {
  const currency = receiptData?.currency;

  if (typeof currency === 'string') {
    return isValidCurrencyCode(currency) ? currency.trim().toUpperCase() : 'IDR';
  }

  if (!currency || typeof currency !== 'object') {
    return 'IDR';
  }

  if (currency.confidence === 'low') {
    return 'IDR';
  }

  const code = typeof currency.code === 'string' ? currency.code.trim() : '';
  if (!code || !isValidCurrencyCode(code)) {
    return 'IDR';
  }

  return code.toUpperCase();
}

/**
 * Display-only money formatting via Intl (locale id-ID).
 */
export function formatCurrency(amount, currency = 'IDR') {
  const code = isValidCurrencyCode(currency)
    ? String(currency).trim().toUpperCase()
    : 'IDR';
  const safe = parseMoneyAmount(amount);
  const fractionDigits = ZERO_DECIMAL.has(code) ? 0 : 2;

  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(safe);
  } catch {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safe);
  }
}
